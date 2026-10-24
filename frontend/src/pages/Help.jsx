import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const text = {
  en: {
    title: 'Help & FAQ',
    intro: 'Answers to common questions about AgriSathi AI.',
    contactTitle: 'Need to talk to an expert?',
    contactText: 'You can call the Kisan Call Centre (toll free): 1800-180-1551',
    tryChat: 'Try AI Chatbot',
  },
  hi: {
    title: 'मदद और अक्सर पूछे जाने वाले सवाल',
    intro: 'एग्रीसाथी AI के बारे में आम सवालों के जवाब।',
    contactTitle: 'किसी विशेषज्ञ से बात करनी है?',
    contactText: 'आप किसान कॉल सेंटर (टोल फ्री) पर फोन कर सकते हैं: 1800-180-1551',
    tryChat: 'AI चैटबॉट आज़माएँ',
  },
};

const faqs = [
  {
    q: {
      en: 'How do I ask a farming question?',
      hi: 'मैं खेती का सवाल कैसे पूछूँ?',
    },
    a: {
      en: 'Login, open AI Chatbot or Ask Query, type your question and press Send. You will get advice in a few seconds.',
      hi: 'लॉगिन करें, AI चैटबॉट या सवाल पूछें खोलें, अपना सवाल लिखें और भेजें दबाएँ। कुछ ही सेकंड में सलाह मिल जाएगी।',
    },
  },
  {
    q: {
      en: 'How do I check a crop disease with a photo?',
      hi: 'फोटो से फसल का रोग कैसे जाँचूँ?',
    },
    a: {
      en: 'Open AI Chatbot and press the Photo button. Take a clear close-up photo of the affected leaf in daylight, then press Send.',
      hi: 'AI चैटबॉट खोलें और फोटो बटन दबाएँ। दिन की रोशनी में प्रभावित पत्ती की साफ़ पास से फोटो लें, फिर भेजें दबाएँ।',
    },
  },
  {
    q: {
      en: 'How do I change the language?',
      hi: 'भाषा कैसे बदलूँ?',
    },
    a: {
      en: 'Press the हिंदी / English button at the top right. In the chatbot, you can also press the translate button under any answer.',
      hi: 'ऊपर दाईं तरफ हिंदी / English बटन दबाएँ। चैटबॉट में हर जवाब के नीचे अनुवाद का बटन भी है।',
    },
  },
  {
    q: {
      en: 'How do I use dark mode?',
      hi: 'डार्क मोड कैसे चालू करूँ?',
    },
    a: {
      en: 'Press the moon or sun button at the top right to switch between dark and light mode.',
      hi: 'ऊपर दाईं तरफ चाँद या सूरज वाला बटन दबाकर डार्क और लाइट मोड बदलें।',
    },
  },
  {
    q: {
      en: 'Is the AI advice final?',
      hi: 'क्या AI की सलाह अंतिम होती है?',
    },
    a: {
      en: 'No. It is guidance only. AI can make mistakes, especially with photos. For chemical sprays, doses or serious crop loss, please ask your local Krishi Vigyan Kendra (KVK) or an agriculture expert.',
      hi: 'नहीं। यह सिर्फ़ मार्गदर्शन है। AI से गलती हो सकती है, ख़ासकर फोटो में। दवाई के छिड़काव, मात्रा या फसल को भारी नुकसान के लिए अपने नज़दीकी कृषि विज्ञान केंद्र (KVK) या कृषि विशेषज्ञ से पूछें।',
    },
  },
  {
    q: {
      en: 'Why is the weather not showing?',
      hi: 'मौसम क्यों नहीं दिख रहा?',
    },
    a: {
      en: 'Check your internet connection and the city name. If the problem continues, please try again after some time.',
      hi: 'अपना इंटरनेट और शहर का नाम जाँचें। समस्या बनी रहे तो कुछ देर बाद फिर कोशिश करें।',
    },
  },
];

function Help() {
  const { language } = useLanguage();
  const s = text[language];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h2 className="text-2xl font-bold text-green-800">❓ {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <div className="mt-5 space-y-3">
        {faqs.map((f, i) => (
          <details key={i} className="group rounded-xl bg-white p-4 shadow">
            <summary className="cursor-pointer font-semibold text-green-800">
              {f.q[language]}
            </summary>
            <p className="mt-2 text-gray-600">{f.a[language]}</p>
          </details>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-green-50 p-5 shadow">
        <h3 className="font-bold text-green-800">📞 {s.contactTitle}</h3>
        <p className="mt-1">{s.contactText}</p>
        <Link
          to="/chat"
          className="mt-3 inline-block rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
        >
          {s.tryChat}
        </Link>
      </div>
    </main>
  );
}

export default Help;