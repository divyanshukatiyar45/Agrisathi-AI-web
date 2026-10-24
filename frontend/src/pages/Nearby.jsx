import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API = import.meta.env.VITE_API_URL;

const text = {
  en: {
    title: 'Nearby Services',
    intro: 'Find mandis, seed & fertilizer shops, veterinary hospitals and banks near you.',
    useLocation: 'Use my location',
    orSearch: 'or search a village / city',
    placeholder: 'Example: Kanpur',
    search: 'Search',
    locating: 'Finding your location...',
    searching: 'Searching...',
    showingNear: 'Showing places near',
    myLocation: 'your current location',
    radius: 'Distance',
    km: 'km',
    loading: 'Loading nearby places...',
    none: 'No places found in this area on the map. Try a bigger distance or use the Google Maps button below.',
    chooseLocation: 'Choose your location above to see nearby places.',
    unnamed: 'Name not available',
    directions: 'Directions',
    call: 'Call',
    hours: 'Timings',
    denied: 'Location permission was denied. You can search a village or city instead.',
    locError: 'Could not get your location. Please search a village or city.',
    notFound: 'This place was not found. Try another name.',
    error: 'Could not load places. Please try again.',
    tooMany: 'Too many requests. Please wait a minute.',
    gmaps: 'Search on Google Maps',
    kvkTitle: 'Krishi Vigyan Kendra (KVK)',
    kvkText: 'KVK gives free farming advice, soil testing and training. Find the nearest one:',
    kvkButton: 'Find KVK on Google Maps',
    note: 'Map data can be incomplete, especially in villages. Please call before you travel.',
    credit: 'Map data © OpenStreetMap contributors',
  },
  hi: {
    title: 'आस-पास की सेवाएँ',
    intro: 'अपने पास की मंडी, बीज-खाद की दुकान, पशु अस्पताल और बैंक खोजें।',
    useLocation: 'मेरी लोकेशन इस्तेमाल करें',
    orSearch: 'या गाँव / शहर का नाम खोजें',
    placeholder: 'उदाहरण: कानपुर',
    search: 'खोजें',
    locating: 'आपकी लोकेशन ढूँढ रहे हैं...',
    searching: 'खोज रहे हैं...',
    showingNear: 'इसके पास की जगहें',
    myLocation: 'आपकी मौजूदा लोकेशन',
    radius: 'दूरी',
    km: 'किमी',
    loading: 'आस-पास की जगहें लोड हो रही हैं...',
    none: 'नक्शे पर इस इलाके में कोई जगह नहीं मिली। ज़्यादा दूरी चुनें या नीचे Google Maps का बटन दबाएँ।',
    chooseLocation: 'आस-पास की जगहें देखने के लिए ऊपर अपनी लोकेशन चुनें।',
    unnamed: 'नाम उपलब्ध नहीं',
    directions: 'रास्ता देखें',
    call: 'फोन करें',
    hours: 'समय',
    denied: 'लोकेशन की अनुमति नहीं मिली। आप गाँव या शहर का नाम खोज सकते हैं।',
    locError: 'आपकी लोकेशन नहीं मिल पाई। कृपया गाँव या शहर का नाम खोजें।',
    notFound: 'यह जगह नहीं मिली। कोई दूसरा नाम आज़माएँ।',
    error: 'जगहें लोड नहीं हो पाईं। कृपया फिर से कोशिश करें।',
    tooMany: 'बहुत ज़्यादा अनुरोध हो गए। कृपया एक मिनट रुकें।',
    gmaps: 'Google Maps पर खोजें',
    kvkTitle: 'कृषि विज्ञान केंद्र (KVK)',
    kvkText: 'KVK खेती की मुफ़्त सलाह, मिट्टी की जाँच और प्रशिक्षण देता है। अपने पास का केंद्र खोजें:',
    kvkButton: 'Google Maps पर KVK खोजें',
    note: 'नक्शे का डेटा अधूरा हो सकता है, ख़ासकर गाँवों में। जाने से पहले फोन करके पूछ लें।',
    credit: 'नक्शे का डेटा © OpenStreetMap योगदानकर्ता',
  },
};

const categories = [
  { value: 'mandi', icon: '🏪', en: 'Mandi / Market', hi: 'मंडी / बाज़ार', query: 'mandi' },
  { value: 'agri', icon: '🧪', en: 'Seed & fertilizer', hi: 'बीज और खाद', query: 'fertilizer seed shop' },
  { value: 'vet', icon: '🐄', en: 'Veterinary', hi: 'पशु अस्पताल', query: 'veterinary hospital' },
  { value: 'bank', icon: '🏦', en: 'Bank', hi: 'बैंक', query: 'bank' },
];

const radii = [5, 10, 25];

function Nearby() {
  const { language } = useLanguage();
  const s = text[language];

  const [coords, setCoords] = useState(null); // { lat, lon, label }
  const [type, setType] = useState('mandi');
  const [radius, setRadius] = useState(10);
  const [place, setPlace] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coords) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          lat: coords.lat,
          lon: coords.lon,
          type,
          radius: radius * 1000,
        });
        const res = await fetch(`${API}/api/nearby?${params}`);
        const data = await res.json();

        if (res.status === 429) {
          setError(s.tooMany);
          setResults([]);
          return;
        }
        if (!res.ok) throw new Error('load failed');
        setResults(data.places);
      } catch (err) {
        setError(s.error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coords, type, radius]);

  const handleUseLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError(s.locError);
      return;
    }
    setBusy('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: '' });
        setBusy('');
      },
      (err) => {
        setError(err.code === 1 ? s.denied : s.locError);
        setBusy('');
      },
      { timeout: 15000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = place.trim();
    if (!q) return;

    setError('');
    setBusy('searching');
    try {
      const res = await fetch(`${API}/api/nearby/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.status === 404) {
        setError(s.notFound);
        return;
      }
      if (res.status === 429) {
        setError(s.tooMany);
        return;
      }
      if (!res.ok) throw new Error('search failed');

      setCoords({ lat: data.lat, lon: data.lon, label: data.label });
    } catch (err) {
      setError(s.error);
    } finally {
      setBusy('');
    }
  };

  const category = categories.find((c) => c.value === type);
  const nearText = coords ? ` near ${coords.lat},${coords.lon}` : '';
  const mapsSearch = (query) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + nearText)}`;

  const pill = (selected) =>
    `rounded-full px-4 py-1 font-semibold ${
      selected ? 'bg-green-700 text-white' : 'border border-green-700 text-green-700'
    }`;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h2 className="text-2xl font-bold text-green-800">📍 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <div className="mt-4 rounded-xl bg-white p-5 shadow">
        <button
          onClick={handleUseLocation}
          disabled={busy !== ''}
          className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:opacity-60"
        >
          📍 {busy === 'locating' ? s.locating : s.useLocation}
        </button>

        <p className="mb-2 mt-4 text-sm text-gray-500">{s.orSearch}</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={s.placeholder}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white p-2 text-gray-800"
          />
          <button
            type="submit"
            disabled={busy !== ''}
            className="rounded-lg border border-green-700 px-5 py-2 font-semibold text-green-700 disabled:opacity-60"
          >
            {busy === 'searching' ? s.searching : s.search}
          </button>
        </form>

        {coords && (
          <p className="mt-3 text-sm text-gray-600">
            {s.showingNear}: <strong>{coords.label || s.myLocation}</strong>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c.value} onClick={() => setType(c.value)} className={pill(type === c.value)}>
            {c.icon} {c[language]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-medium">{s.radius}:</span>
        {radii.map((r) => (
          <button key={r} onClick={() => setRadius(r)} className={pill(radius === r)}>
            {r} {s.km}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!coords && !error && <p className="mt-6 text-gray-500">{s.chooseLocation}</p>}
      {loading && <p className="mt-6 text-gray-500">{s.loading}</p>}
      {coords && !loading && !error && results.length === 0 && (
        <p className="mt-6 text-gray-500">{s.none}</p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {results.map((p) => (
          <div
            key={p.id}
            className="rounded-xl bg-white p-4 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-green-800">
                {category.icon} {(language === 'hi' && p.nameHi) || p.name || s.unnamed}
              </h3>
              <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                {p.distanceKm} {s.km}
              </span>
            </div>

            {p.address && <p className="mt-1 text-sm text-gray-600">{p.address}</p>}
            {p.openingHours && (
              <p className="mt-1 text-sm text-gray-500">
                🕒 {s.hours}: {p.openingHours}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-700 px-4 py-1 text-sm font-semibold text-white"
              >
                🧭 {s.directions}
              </a>
              {p.phone && (
                <a
                  href={`tel:${p.phone.split(';')[0].replace(/\s/g, '')}`}
                  className="rounded-lg border border-green-700 px-4 py-1 text-sm font-semibold text-green-700"
                >
                  📞 {s.call}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={mapsSearch(category.query)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-green-700 bg-white px-5 py-2 font-semibold text-green-700"
        >
          🗺️ {s.gmaps}: {category[language]}
        </a>
      </div>

      <div className="mt-6 rounded-xl bg-green-50 p-5 shadow">
        <h3 className="font-bold text-green-800">🌾 {s.kvkTitle}</h3>
        <p className="mt-1 text-gray-600">{s.kvkText}</p>
        <a
          href={mapsSearch('Krishi Vigyan Kendra')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
        >
          {s.kvkButton} ↗
        </a>
      </div>

      <p className="mt-6 text-sm text-gray-500">{s.note}</p>
      <p className="mt-1 text-xs text-gray-400">{s.credit}</p>
    </main>
  );
}

export default Nearby;