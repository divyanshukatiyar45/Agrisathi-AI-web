import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API = import.meta.env.VITE_API_URL;

const text = {
  en: {
    title: 'Mandi Prices',
    intro: 'Wholesale mandi prices from Agmarknet. All prices are in ₹ per quintal (100 kg).',
    state: 'State',
    commodity: 'Commodity',
    district: 'District',
    sort: 'Sort by',
    all: 'All',
    high: 'Price: high to low',
    low: 'Price: low to high',
    modal: 'Modal price',
    min: 'Min',
    max: 'Max',
    perQuintal: '₹ / quintal',
    market: 'Market',
    date: 'Date',
    loading: 'Loading prices...',
    noData: 'No price data found for this selection.',
    error: 'Could not load prices. Please try again.',
    setup: 'Market price service is not set up yet.',
    showing: (a, b) => `Showing ${a} of ${b} prices`,
    showMore: 'Show more',
    oldData: (d) =>
      `This data looks old (latest date: ${d}). Mandi prices may not be updated every day.`,
    note: 'Modal price is the most common price in that mandi. Prices are indicative, so please check with your local mandi before selling.',
  },
  hi: {
    title: 'मंडी भाव',
    intro: 'एगमार्कनेट से थोक मंडी भाव। सभी भाव ₹ प्रति क्विंटल (100 किलो) में हैं।',
    state: 'राज्य',
    commodity: 'उपज',
    district: 'जिला',
    sort: 'क्रम',
    all: 'सभी',
    high: 'भाव: ज़्यादा से कम',
    low: 'भाव: कम से ज़्यादा',
    modal: 'मॉडल भाव',
    min: 'कम से कम',
    max: 'ज़्यादा से ज़्यादा',
    perQuintal: '₹ / क्विंटल',
    market: 'मंडी',
    date: 'तारीख',
    loading: 'भाव लोड हो रहे हैं...',
    noData: 'इस चयन के लिए कोई भाव नहीं मिला।',
    error: 'भाव लोड नहीं हो पाए। कृपया फिर से कोशिश करें।',
    setup: 'मंडी भाव सेवा अभी तैयार नहीं है।',
    showing: (a, b) => `${b} में से ${a} भाव दिख रहे हैं`,
    showMore: 'और दिखाएँ',
    oldData: (d) =>
      `यह डेटा पुराना लग रहा है (आखिरी तारीख: ${d})। मंडी भाव रोज़ अपडेट नहीं भी हो सकते।`,
    note: 'मॉडल भाव उस मंडी का सबसे आम भाव होता है। भाव सिर्फ़ अंदाज़े के लिए हैं, बेचने से पहले अपनी नज़दीकी मंडी में पूछ लें।',
  },
};

// Agmarknet ke hisaab se state ke naam (spelling wahi rakhni hai)
const states = [
  { value: 'Uttar Pradesh', en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
  { value: 'Bihar', en: 'Bihar', hi: 'बिहार' },
  { value: 'Madhya Pradesh', en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' },
  { value: 'Rajasthan', en: 'Rajasthan', hi: 'राजस्थान' },
  { value: 'Punjab', en: 'Punjab', hi: 'पंजाब' },
  { value: 'Haryana', en: 'Haryana', hi: 'हरियाणा' },
  { value: 'Maharashtra', en: 'Maharashtra', hi: 'महाराष्ट्र' },
  { value: 'Gujarat', en: 'Gujarat', hi: 'गुजरात' },
  { value: 'West Bengal', en: 'West Bengal', hi: 'पश्चिम बंगाल' },
  { value: 'Karnataka', en: 'Karnataka', hi: 'कर्नाटक' },
  { value: 'Tamil Nadu', en: 'Tamil Nadu', hi: 'तमिलनाडु' },
  { value: 'Andhra Pradesh', en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश' },
  { value: 'Telangana', en: 'Telangana', hi: 'तेलंगाना' },
  { value: 'Odisha', en: 'Odisha', hi: 'ओडिशा' },
  { value: 'Chhattisgarh', en: 'Chhattisgarh', hi: 'छत्तीसगढ़' },
  { value: 'Jharkhand', en: 'Jharkhand', hi: 'झारखंड' },
  { value: 'Uttrakhand', en: 'Uttarakhand', hi: 'उत्तराखंड' },
  { value: 'Himachal Pradesh', en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश' },
  { value: 'Delhi', en: 'Delhi', hi: 'दिल्ली' },
];

// Aam fasalon ke Hindi naam (baaki English mein hi dikhenge)
const hindiNames = [
  ['paddy', 'धान'],
  ['rice', 'चावल'],
  ['wheat', 'गेहूं'],
  ['maize', 'मक्का'],
  ['bajra', 'बाजरा'],
  ['jowar', 'ज्वार'],
  ['barley', 'जौ'],
  ['gram', 'चना'],
  ['arhar', 'अरहर (तुअर)'],
  ['masur', 'मसूर'],
  ['mustard', 'सरसों'],
  ['soyabean', 'सोयाबीन'],
  ['groundnut', 'मूंगफली'],
  ['potato', 'आलू'],
  ['onion', 'प्याज'],
  ['tomato', 'टमाटर'],
  ['garlic', 'लहसुन'],
  ['ginger', 'अदरक'],
  ['cauliflower', 'फूलगोभी'],
  ['cabbage', 'पत्तागोभी'],
  ['brinjal', 'बैंगन'],
  ['bhindi', 'भिंडी'],
  ['banana', 'केला'],
  ['apple', 'सेब'],
  ['mango', 'आम'],
  ['sugarcane', 'गन्ना'],
];

function hindiName(commodity) {
  const lower = commodity.toLowerCase();
  const found = hindiNames.find(([key]) => lower.includes(key));
  return found ? found[1] : null;
}

function parseDate(str) {
  const [d, m, y] = String(str).split('/').map(Number);
  return d && m && y ? new Date(y, m - 1, d) : null;
}

const money = (n) => (n === null ? '-' : `₹${n.toLocaleString('en-IN')}`);

function Market() {
  const { language } = useLanguage();
  const s = text[language];

  const [state, setState] = useState('Uttar Pradesh');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commodity, setCommodity] = useState('all');
  const [district, setDistrict] = useState('all');
  const [sort, setSort] = useState('high');
  const [visible, setVisible] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setRecords([]);
      setCommodity('all');
      setDistrict('all');
      setVisible(30);
      try {
        const res = await fetch(`${API}/api/market?state=${encodeURIComponent(state)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(
            data.message && data.message.includes('not set up') ? s.setup : s.error
          );
          return;
        }
        setRecords(data.records);
      } catch (err) {
        setError(s.error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [state]);

  const commodities = useMemo(
    () => [...new Set(records.map((r) => r.commodity))].sort(),
    [records]
  );
  const districts = useMemo(
    () => [...new Set(records.map((r) => r.district).filter(Boolean))].sort(),
    [records]
  );

  const filtered = useMemo(() => {
    const list = records.filter(
      (r) =>
        (commodity === 'all' || r.commodity === commodity) &&
        (district === 'all' || r.district === district)
    );
    return list.sort((a, b) => (sort === 'high' ? b.modal - a.modal : a.modal - b.modal));
  }, [records, commodity, district, sort]);

  // Sabse nayi tareekh dekhkar purane data ki chetavani
  const latest = useMemo(() => {
    const dates = records.map((r) => parseDate(r.date)).filter(Boolean);
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  }, [records]);
  const isOld = latest && (Date.now() - latest.getTime()) / 86400000 > 7;
  const latestText = latest
    ? latest.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const commodityLabel = (c) => {
    const hi = hindiName(c);
    return language === 'hi' && hi ? `${hi} (${c})` : c;
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold text-green-800">💰 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{s.state}</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
            {states.map((st) => (
              <option key={st.value} value={st.value}>
                {st[language]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{s.commodity}</label>
          <select
            value={commodity}
            onChange={(e) => {
              setCommodity(e.target.value);
              setVisible(30);
            }}
            className={selectClass}
          >
            <option value="all">{s.all}</option>
            {commodities.map((c) => (
              <option key={c} value={c}>
                {commodityLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{s.district}</label>
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setVisible(30);
            }}
            className={selectClass}
          >
            <option value="all">{s.all}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{s.sort}</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            <option value="high">{s.high}</option>
            <option value="low">{s.low}</option>
          </select>
        </div>
      </div>

      {isOld && (
        <p className="mt-4 rounded-lg bg-yellow-100 p-3 text-yellow-900">
          ⚠️ {s.oldData(latestText)}
        </p>
      )}

      {loading && <p className="mt-6 text-gray-500">{s.loading}</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="mt-6 text-gray-500">{s.noData}</p>
      )}

      {filtered.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          {s.showing(Math.min(visible, filtered.length), filtered.length)}
        </p>
      )}

      <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visible).map((r, i) => (
          <div
            key={`${r.market}-${r.commodity}-${r.variety}-${i}`}
            className="rounded-xl bg-white p-4 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <h3 className="text-lg font-bold text-green-800">{commodityLabel(r.commodity)}</h3>
            <p className="text-sm text-gray-600">
              {[r.variety, r.grade].filter((x) => x && x !== 'NA').join(' · ')}
            </p>

            <p className="mt-3 text-3xl font-bold text-green-700">{money(r.modal)}</p>
            <p className="text-xs text-gray-500">
              {s.modal} · {s.perQuintal}
            </p>

            <div className="mt-3 flex justify-between text-sm">
              <span>
                {s.min}: <strong>{money(r.min)}</strong>
              </span>
              <span>
                {s.max}: <strong>{money(r.max)}</strong>
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              📍 {r.market}
              {r.district ? `, ${r.district}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              📅 {s.date}: {r.date}
            </p>
          </div>
        ))}
      </div>

      {filtered.length > visible && (
        <button
          onClick={() => setVisible((v) => v + 30)}
          className="mt-5 rounded-lg border border-green-700 bg-white px-6 py-2 font-semibold text-green-700"
        >
          {s.showMore}
        </button>
      )}

      <p className="mt-8 text-sm text-gray-500">{s.note}</p>
    </main>
  );
}

export default Market;