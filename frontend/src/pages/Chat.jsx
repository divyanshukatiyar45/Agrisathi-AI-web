import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

// **bold** text ko bold dikhane ke liye
function renderText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Translate button ka label (jis bhasha mein dekhna hai uske hisaab se)
const buttonLabel = (target) => (target === 'hi' ? '🌐 हिंदी में देखें' : '🌐 View in English');

// Badi photo ko chhota karte hain (max 1280px), taaki upload tez ho
function resizeImage(file, maxSize = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error('resize failed'));
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('load failed'));
    };

    img.src = url;
  });
}

// Har message: { role, texts: { en, hi }, shown: 'en' | 'hi', translating, imageUrl? }
function Chat() {
  const { t, language } = useLanguage();
  const { token, logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!token) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-lg">{t('loginToChat')}</p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-lg bg-green-700 px-6 py-2 font-semibold text-white"
          >
            {t('login')}
          </Link>
        </div>
      </main>
    );
  }

  const updateMessage = (index, changes) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, ...changes } : m)));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    if (!file.type.startsWith('image/')) {
      setError(t('photoOnlyImages'));
      return;
    }

    try {
      const blob = await resizeImage(file);
      setPhoto(blob);
      setPhotoPreview(URL.createObjectURL(blob));
    } catch (err) {
      setError(t('photoReadError'));
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim() || (photo ? t('defaultPhotoQuestion') : '');
    if (!text || loading) return;

    const currentPhoto = photo;
    const currentPreview = photoPreview;

    setError('');
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        texts: { [language]: text },
        shown: language,
        translating: false,
        imageUrl: currentPreview || null,
      },
    ]);
    setInput('');
    setPhoto(null);
    setPhotoPreview('');
    setLoading(true);
    setSendingPhoto(Boolean(currentPhoto));

    try {
      let res;

      if (currentPhoto) {
        const form = new FormData();
        form.append('image', currentPhoto, 'photo.jpg');
        form.append('message', text);
        form.append('language', language);
        if (chatId) form.append('chatId', chatId);

        res = await fetch(`${API}/api/chat/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        res = await fetch(`${API}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text, language, chatId }),
        });
      }

      const data = await res.json();

      if (res.status === 401) {
        setError(t('sessionExpired'));
        logout();
        return;
      }
      if (!res.ok) {
        setError(data.message || t('chatError'));
        return;
      }

      setChatId(data.chatId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          texts: { [language]: data.reply },
          shown: language,
          translating: false,
        },
      ]);
    } catch (err) {
      setError(t('chatError'));
    } finally {
      setLoading(false);
      setSendingPhoto(false);
    }
  };

  // Ek jawab ko dusri bhasha mein translate karo (ya pehle se translate hai to bas badlo)
  const handleTranslate = async (index) => {
    const m = messages[index];
    if (!m || m.translating) return;

    const target = m.shown === 'en' ? 'hi' : 'en';

    if (m.texts[target]) {
      updateMessage(index, { shown: target });
      return;
    }

    setError('');
    updateMessage(index, { translating: true });

    try {
      const res = await fetch(`${API}/api/chat/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texts: [m.texts[m.shown]], language: target }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setError(t('sessionExpired'));
        logout();
        return;
      }
      if (!res.ok) {
        setError(t('chatError'));
        updateMessage(index, { translating: false });
        return;
      }

      setMessages((prev) =>
        prev.map((x, i) =>
          i === index
            ? { ...x, texts: { ...x.texts, [target]: data.texts[0] }, shown: target, translating: false }
            : x
        )
      );
    } catch (err) {
      setError(t('chatError'));
      updateMessage(index, { translating: false });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
    setError('');
    clearPhoto();
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col p-4" style={{ height: 'calc(100vh - 130px)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-800">{t('chatTitle')}</h2>
        <button
          onClick={handleNewChat}
          className="rounded-lg bg-white px-4 py-1 font-semibold text-green-700 shadow"
        >
          {t('newChat')}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow">
        {messages.length === 0 && (
          <p className="text-gray-500">🌾 {t('chatWelcome')}</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2 ${
                m.role === 'user' ? 'bg-green-700 text-white' : 'bg-green-50 text-gray-800'
              }`}
            >
              <p className="mb-1 text-xs font-semibold opacity-70">
                {m.role === 'user' ? t('you') : t('aiName')}
              </p>

              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="crop"
                  className="mb-2 max-h-56 rounded-lg object-cover"
                />
              )}

              {renderText(m.texts[m.shown])}

              {m.role === 'assistant' && (
                <button
                  onClick={() => handleTranslate(i)}
                  disabled={m.translating}
                  className="mt-2 block rounded-lg border border-green-700 bg-white px-3 py-1 text-sm font-semibold text-green-700 disabled:opacity-60"
                >
                  {m.translating
                    ? t('loading')
                    : buttonLabel(m.shown === 'en' ? 'hi' : 'en')}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-gray-500">{sendingPhoto ? t('analyzing') : t('thinking')}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-red-600">{error}</p>}

      {photoPreview && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-2 shadow">
          <img src={photoPreview} alt="selected" className="h-16 w-16 rounded-lg object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="font-semibold text-red-600"
          >
            ✕ {t('removePhoto')}
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="rounded-lg border border-green-700 bg-white px-4 py-2 font-semibold text-green-700 disabled:opacity-60"
        >
          📷 {t('addPhoto')}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chatPlaceholder')}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white p-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:opacity-60"
        >
          {t('send')}
        </button>
      </form>
    </main>
  );
}

export default Chat;
