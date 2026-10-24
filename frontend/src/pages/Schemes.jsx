import { useLanguage } from '../context/LanguageContext';

const text = {
  en: {
    title: 'Government Schemes for Farmers',
    intro: 'Important schemes every farmer should know about.',
    visit: 'Visit official website',
    note: 'Eligibility and benefits can change. Please check the official website, your nearest Common Service Centre (CSC) or Krishi Vigyan Kendra (KVK) for the latest details.',
  },
  hi: {
    title: 'किसानों के लिए सरकारी योजनाएँ',
    intro: 'हर किसान को ये ज़रूरी योजनाएँ जाननी चाहिए।',
    visit: 'आधिकारिक वेबसाइट देखें',
    note: 'पात्रता और लाभ बदल सकते हैं। ताज़ा जानकारी के लिए आधिकारिक वेबसाइट, नज़दीकी कॉमन सर्विस सेंटर (CSC) या कृषि विज्ञान केंद्र (KVK) से पूछें।',
  },
};

const schemes = [
  {
    icon: '💵',
    name: { en: 'PM-KISAN', hi: 'पीएम-किसान' },
    desc: {
      en: 'Income support for farmer families, paid directly into the bank account.',
      hi: 'किसान परिवारों के लिए आय सहायता, जो सीधे बैंक खाते में आती है।',
    },
    link: 'https://pmkisan.gov.in',
  },
  {
    icon: '🛡️',
    name: { en: 'PM Fasal Bima Yojana', hi: 'प्रधानमंत्री फसल बीमा योजना' },
    desc: {
      en: 'Crop insurance that protects farmers from loss due to natural disasters, pests and diseases.',
      hi: 'फसल बीमा, जो प्राकृतिक आपदा, कीट और रोग से हुए नुकसान में किसानों को सुरक्षा देता है।',
    },
    link: 'https://pmfby.gov.in',
  },
  {
    icon: '💳',
    name: { en: 'Kisan Credit Card (KCC)', hi: 'किसान क्रेडिट कार्ड (KCC)' },
    desc: {
      en: 'Easy short-term loan for seeds, fertilizer and other farming needs. Apply at your bank.',
      hi: 'बीज, खाद और खेती की दूसरी ज़रूरतों के लिए आसान अल्पकालिक कर्ज़। अपने बैंक में आवेदन करें।',
    },
    link: '',
  },
  {
    icon: '🧪',
    name: { en: 'Soil Health Card', hi: 'मृदा स्वास्थ्य कार्ड' },
    desc: {
      en: 'Soil testing and a report that tells which fertilizer your field needs.',
      hi: 'मिट्टी की जाँच और रिपोर्ट, जो बताती है कि आपके खेत को कौन सी खाद चाहिए।',
    },
    link: 'https://soilhealth.dac.gov.in',
  },
  {
    icon: '🏪',
    name: { en: 'eNAM (online mandi)', hi: 'ई-नाम (ऑनलाइन मंडी)' },
    desc: {
      en: 'National online market where farmers can sell their produce to buyers across mandis.',
      hi: 'राष्ट्रीय ऑनलाइन बाज़ार, जहाँ किसान अपनी उपज कई मंडियों के खरीदारों को बेच सकते हैं।',
    },
    link: 'https://enam.gov.in',
  },
  {
    icon: '☀️',
    name: { en: 'PM-KUSUM (solar pumps)', hi: 'पीएम-कुसुम (सोलर पंप)' },
    desc: {
      en: 'Support for solar irrigation pumps to cut diesel and electricity costs.',
      hi: 'डीज़ल और बिजली का खर्च घटाने के लिए सोलर सिंचाई पंप में सहायता।',
    },
    link: 'https://pmkusum.mnre.gov.in',
  },
  {
    icon: '💧',
    name: { en: 'PM Krishi Sinchayee Yojana', hi: 'प्रधानमंत्री कृषि सिंचाई योजना' },
    desc: {
      en: 'Better irrigation facilities and water saving methods like drip and sprinkler.',
      hi: 'बेहतर सिंचाई सुविधा और ड्रिप व स्प्रिंकलर जैसे पानी बचाने वाले तरीके।',
    },
    link: 'https://pmksy.gov.in',
  },
];

function Schemes() {
  const { language } = useLanguage();
  const s = text[language];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold text-green-800">📜 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {schemes.map((item, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-5 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-4xl">{item.icon}</div>
            <h3 className="mt-2 text-lg font-bold text-green-800">{item.name[language]}</h3>
            <p className="mt-1 text-gray-600">{item.desc[language]}</p>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-semibold text-green-700 underline"
              >
                {s.visit} →
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">{s.note}</p>
    </main>
  );
}

export default Schemes;