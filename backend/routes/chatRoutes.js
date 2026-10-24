const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Crop = require('../models/Crop');

const router = express.Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Photo upload settings (memory mein rakhte hain, disk par save nahi hoti)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('ONLY_IMAGES'));
    }
  },
});

function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image too large (max 5 MB)' });
      }
      if (err.message === 'ONLY_IMAGES') {
        return res.status(400).json({ message: 'Only JPG, PNG or WEBP images are allowed' });
      }
      return res.status(400).json({ message: 'Upload error' });
    }
    next();
  });
}

function languageRule(language) {
  return language === 'hi'
    ? 'Reply ONLY in simple Hindi written in Devanagari script (हिंदी). Do not write English sentences, even if the question is written in English or Hinglish. Technical words like DAP or urea may stay as they are.'
    : 'Reply ONLY in simple English. Do not use Hindi script, even if the question is written in Hindi or Hinglish.';
}

function buildSystemPrompt(language, cropContext) {
  return `You are AgriSathi, a friendly farming advisor for Indian farmers.
Help with crops, soil, irrigation, fertilizers, pests, diseases, weather and mandi prices.
Give practical, short, step-by-step advice in simple words.
If a question is not about farming, politely bring the conversation back to farming.

VERIFIED CROP DATA (use this first when the question is about these crops; do not contradict it):
${cropContext}

Rules:
- For timing, dose and quantity questions, prefer the verified data above.
- If the exact number is not in the verified data and you are not sure, do not guess. Say you are not sure and suggest the local Krishi Vigyan Kendra (KVK).
- Never invent pesticide or fertilizer doses.
- LANGUAGE RULE: ${languageRule(language)}`;
}

function buildImageInstruction(language, cropContext) {
  return `${buildSystemPrompt(language, cropContext)}

PHOTO RULES (the farmer attached a photo of a crop, leaf, soil or pest):
- First say briefly what you see in the photo.
- Then give the most likely problem(s): disease, pest, nutrient deficiency or water stress. Say how sure you are (low, medium or high).
- Mention what the farmer should check in the field to confirm.
- Give only safe, general steps. Do NOT give any pesticide or fungicide name with dose. For chemical treatment, tell the farmer to ask the local Krishi Vigyan Kendra (KVK) or an agriculture expert.
- If the photo is blurry, too dark, or not a plant, say so and ask for a clearer photo (close-up of the affected leaf in daylight).
- A photo alone can be misleading, so remind the farmer that this is guidance, not a final diagnosis.`;
}

async function getCropContext(language) {
  const crops = await Crop.find({});
  const hi = language === 'hi';

  return crops
    .map((c) => {
      const pick = (field) => (hi && c[`${field}Hi`] ? c[`${field}Hi`] : c[field]);
      return `- ${hi ? c.nameHi : c.name} (${hi ? c.name : c.nameHi}), season: ${c.season}, soil: ${pick('soilType')}, sowing: ${pick('sowingMonths')}, harvest: ${pick('harvestMonths')}, duration: ${c.durationDays} days, water: ${pick('waterRequirement')}, fertilizer: ${pick('fertilizer')}, irrigation: ${pick('irrigationGuide')}`;
    })
    .join('\n');
}

// Ek text ko seedha plain text mein translate karta hai
async function translateOne(text, language) {
  const target = language === 'hi' ? 'simple Hindi in Devanagari script' : 'simple English';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate the user's text into ${target}. Keep numbers, **bold** markers, line breaks and technical words (DAP, urea, MOP, KVK) unchanged. Return ONLY the translated text, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ? data.error.message : 'AI service error');
  }

  const result = data.choices[0].message.content;
  if (!result || !result.trim()) {
    throw new Error('Empty translation');
  }
  return result.trim();
}

// Translate: POST /api/chat/translate  { texts: [..], language }
router.post('/translate', auth, async (req, res) => {
  try {
    const { texts } = req.body;
    const language = req.body.language === 'hi' ? 'hi' : 'en';

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ message: 'texts array is required' });
    }

    const translated = await Promise.all(texts.map((t) => translateOne(String(t), language)));
    res.status(200).json({ texts: translated });
  } catch (error) {
    console.log('Translate error:', error.message);
    res.status(500).json({ message: 'Translation failed', error: error.message });
  }
});

// Photo + question: POST /api/chat/image  (multipart: image, message, language, chatId?)
router.post('/image', auth, uploadImage, async (req, res) => {
  try {
    const language = req.body.language === 'hi' ? 'hi' : 'en';
    const chatId = req.body.chatId || null;
    const message =
      (req.body.message || '').trim() ||
      (language === 'hi'
        ? 'मेरी फसल की इस फोटो में क्या समस्या है?'
        : 'What is wrong with my crop in this photo?');

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Photo analysis is not set up yet' });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.user.id });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    } else {
      chat = new Chat({
        user: req.user.id,
        title: message.slice(0, 40),
        messages: [],
      });
    }

    // Pichli baatcheet (sirf text) context ke liye
    const previous = chat.messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Farmer' : 'AgriSathi'}: ${m.content}`)
      .join('\n');

    const cropContext = await getCropContext(language);

    const userText = `${previous ? `Earlier conversation:\n${previous}\n\n` : ''}Farmer's question about the attached photo: ${message}\n\n[${languageRule(language)}]`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildImageInstruction(language, cropContext) }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: req.file.buffer.toString('base64'),
                },
              },
              { text: userText },
            ],
          },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('Gemini error:', data.error ? data.error.message : data);
      return res.status(500).json({
        message: 'Photo analysis error',
        error: data.error ? data.error.message : 'Unknown error',
      });
    }

    const parts =
      data.candidates && data.candidates[0] && data.candidates[0].content
        ? data.candidates[0].content.parts || []
        : [];
    const reply = parts
      .map((p) => p.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(500).json({ message: 'Could not analyze this photo. Please try another one.' });
    }

    chat.messages.push({ role: 'user', content: `📷 ${message}` });
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.status(200).json({ chatId: chat._id, reply });
  } catch (error) {
    console.log('Image route error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message: POST /api/chat  { message, language, chatId? }
router.post('/', auth, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const language = req.body.language === 'hi' ? 'hi' : 'en';

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.user.id });
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    } else {
      chat = new Chat({
        user: req.user.id,
        title: message.trim().slice(0, 40),
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content: message.trim() });

    // Pichle 10 messages AI ko context ke liye bhejte hain
    const history = chat.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Sabse naye sawaal ke saath bhasha ka order dobara jodte hain (database mein save nahi hota)
    const last = history[history.length - 1];
    last.content = `${last.content}\n\n[${languageRule(language)}]`;

    const cropContext = await getCropContext(language);

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(language, cropContext) },
          ...history,
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        message: 'AI service error',
        error: data.error ? data.error.message : 'Unknown error',
      });
    }

    const reply = data.choices[0].message.content;
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.status(200).json({ chatId: chat._id, reply });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// All chats of the user: GET /api/chat
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .select('title updatedAt')
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// One chat with messages: GET /api/chat/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;