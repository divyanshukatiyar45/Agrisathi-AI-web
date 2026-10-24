import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const hero = {
  en: {
    tag: 'AI-BASED FARMER QUERY SUPPORT & ADVISORY SYSTEM',
    title: 'Welcome to AgriSathi-AI',
    text: 'Your AI-powered farming companion — weather, fertilizer advice & instant answers, all in one place.',
    button: 'Ask AgriSathi AI',
  },
  hi: {
    tag: 'AI आधारित किसान प्रश्न सहायता एवं सलाह प्रणाली',
    title: 'एग्रीसाथी-AI में आपका स्वागत है',
    text: 'आपका AI-संचालित खेती साथी — मौसम, खाद की सलाह और तुरंत जवाब, सब एक जगह।',
    button: 'एग्रीसाथी AI से पूछें',
  },
};

function Home() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [imgFailed, setImgFailed] = useState(false);
  const h = hero[language];

  const cards = [
    { to: '/chat', icon: '🤖', title: t('chatbot'), text: t('chatCardText') },
    { to: '/weather', icon: '🌦️', title: t('weather'), text: t('weatherCardText') },
    { to: '/crops', icon: '🌾', title: t('crops'), text: t('cropsCardText') },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6">
      {user && (
        <p className="mb-4 text-lg font-semibold text-green-800">
          {t('welcomeBack')}, {user.name} 👋
        </p>
      )}

      <section className="grid items-center gap-6 rounded-2xl bg-[#1f2a55] p-6 shadow-lg md:grid-cols-2 md:p-10">
        <div>
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-200">
            {h.tag}
          </span>

          <h1
            className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {h.title}
          </h1>

          <p className="mt-4 text-slate-300">{h.text}</p>

          <Link
            to="/chat"
            className="mt-6 inline-block rounded-lg bg-[#d4a537] px-6 py-3 font-bold text-[#1f2a55] shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"
          >
            {h.button}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl">
          {imgFailed ? (
            <div className="flex h-72 items-center justify-center rounded-2xl bg-green-700 text-8xl">
              👨‍🌾
            </div>
          ) : (
            <img
              src="/farmer.png"
              alt="Farmer"
              onError={() => setImgFailed(true)}
              className="h-72 w-full object-cover md:h-96"
            />
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white p-6 shadow transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-[1.04] hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/40 active:scale-95"
          >
            {/* upar ki hari patti jo hover par dikhti hai */}
            <span className="absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 bg-gradient-to-r from-green-500 via-emerald-400 to-yellow-400 transition-transform duration-300 group-hover:scale-x-100" />

            <div className="inline-block text-5xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125">
              {card.icon}
            </div>

            <h3 className="mt-3 text-xl font-bold text-green-800 transition-colors duration-300 group-hover:text-green-600">
              {card.title}
            </h3>
            <p className="mt-1 text-gray-600">{card.text}</p>

            <span className="mt-4 inline-flex items-center gap-1 font-semibold text-green-700">
              {t('open')}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default Home;