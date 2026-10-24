import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const text = {
  en: {
    title: 'Ask Your Query',
    intro: 'Choose a topic, write your problem, and get advice from AI.',
    topic: 'Topic',
    question: 'Your question',
    placeholder: 'Example: My wheat leaves are turning yellow. What should I do?',
    submit: 'Get Answer',
    wait: 'Getting your answer...',
    answer: 'Answer',
    loginNeeded: 'Please login to ask a query.',
    empty: 'Please write your question.',
    error: 'Could not get an answer. Please try again.',
    expired: 'Your session has expired. Please login again.',
    clear: 'Ask another',
    note: 'This is guidance only. For chemical sprays or doses, please ask your local Krishi Vigyan Kendra (KVK).',
  },
  hi: {
    title: 'अपना सवाल पूछें',
    intro: 'विषय चुनें, अपनी समस्या लिखें और AI से सलाह पाएँ।',
    topic: 'विषय',
    question: 'आपका सवाल',
    placeholder: 'उदाहरण: मेरे गेहूँ की पत्तियाँ पीली पड़ रही हैं। मुझे क्या करना चाहिए?',
    submit: 'जवाब पाएँ',
    wait: 'जवाब तैयार हो रहा है...',
    answer: 'जवाब',
    loginNeeded: 'सवाल पूछने के लिए कृपया लॉगिन करें।',
    empty: 'कृपया अपना सवाल लिखें।',
    error: 'जवाब नहीं मिल पाया। कृपया फिर से कोशिश करें।',
    expired: 'आपका सेशन खत्म हो गया है। कृपया फिर से लॉगिन करें।',
    clear: 'दूसरा सवाल पूछें',
    note: 'यह सिर्फ़ सलाह है। दवाई के छिड़काव या मात्रा के लिए अपने नज़दीकी कृषि विज्ञान केंद्र (KVK) से पूछें।',
  },
};

const categories = [
  { value: 'Crop', en: 'Crop', hi: 'फसल' },
  { value: 'Soil', en: 'Soil', hi: 'मिट्टी' },
  { value: 'Fertilizer', en: 'Fertilizer', hi: 'खाद' },
  { value: 'Irrigation', en: 'Irrigation', hi: 'सिंचाई' },
  { value: 'Pest and disease', en: 'Pest & disease', hi: 'कीट और रोग' },
  { value: 'Other', en: 'Other', hi: 'अन्य' },
];

// **bold** text ko bold dikhane ke liye
function renderText(str) {
  return str.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function AskQuery() {
  const { language } = useLanguage();
  const { token, logout } = useAuth();
  const s = text[language];

  const [category, setCategory] = useState('Crop');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-lg">{s.loginNeeded}</p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-lg bg-green-700 px-6 py-2 font-semibold text-white"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError(s.empty);
      return;
    }

    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Topic: ${category}. Question: ${question.trim()}`,
          language,
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setError(s.expired);
        logout();
        return;
      }
      if (!res.ok) {
        setError(data.message || s.error);
        return;
      }
      setAnswer(data.reply);
    } catch (err) {
      setError(s.error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer('');
    setError('');
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h2 className="text-2xl font-bold text-green-800">💬 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <form onSubmit={handleSubmit} className="mt-4 rounded-xl bg-white p-5 shadow">
        <label className="mb-2 block font-medium">{s.topic}</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-4 py-1 font-semibold ${
                category === c.value
                  ? 'bg-green-700 text-white'
                  : 'border border-green-700 text-green-700'
              }`}
            >
              {c[language]}
            </button>
          ))}
        </div>

        <label className="mb-1 mt-4 block font-medium">{s.question}</label>
        <textarea
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={s.placeholder}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-3"
        />

        {error && <p className="mt-2 text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? s.wait : s.submit}
        </button>
      </form>

      {answer && (
        <div className="mt-5 rounded-xl bg-green-50 p-5 shadow">
          <h3 className="mb-2 font-bold text-green-800">{s.answer}</h3>
          <div className="whitespace-pre-wrap">{renderText(answer)}</div>
          <p className="mt-4 text-sm text-gray-500">{s.note}</p>
          <button
            onClick={handleClear}
            className="mt-3 rounded-lg border border-green-700 bg-white px-4 py-1 font-semibold text-green-700"
          >
            {s.clear}
          </button>
        </div>
      )}
    </main>
  );
}

export default AskQuery;