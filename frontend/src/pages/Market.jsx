import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const text = {
  en: {
    title: 'Mandi Prices',
    intro: 'Wholesale mandi prices added by our team. All prices are in ₹ per quintal (100 kg).',
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
    date: 'Date',
    loading: 'Loading prices...',
    noData: 'No prices found yet.',
    error: 'Could not load prices. Please try again.',
    showMore: 'Show more',
    oldData: (d) => `The latest price in our list is from ${d}. It may be old, so please check the live prices below.`,
    liveTitle: 'Check live mandi prices',
    liveText: 'For today’s live rates, use these official government websites:',
    note: 'Modal price is the most common price in that mandi. Prices are indicative, so please check with your local mandi before selling.',
    adminTitle: 'Admin: add price',
    editTitle: 'Admin: edit price',
    commodityEn: 'Commodity (English)',
    commodityHi: 'Commodity (Hindi, optional)',
    market: 'Mandi / market name',
    state: 'State',
    save: 'Save price',
    update: 'Update price',
    cancel: 'Cancel',
    saving: 'Saving...',
    edit: 'Edit',
    remove: 'Delete',
    confirmDelete: 'Delete this price?',
    saveError: 'Could not save. Please try again.',
    expired: 'Your session has expired. Please login again.',
    needAdmin: 'Admin access required.',
  },
  hi: {
    title: 'मंडी भाव',
    intro: 'हमारी टीम द्वारा जोड़े गए थोक मंडी भाव। सभी भाव ₹ प्रति क्विंटल (100 किलो) में हैं।',
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
    date: 'तारीख',
    loading: 'भाव लोड हो रहे हैं...',
    noData: 'अभी कोई भाव नहीं मिला।',
    error: 'भाव लोड नहीं हो पाए। कृपया फिर से कोशिश करें।',
    showMore: 'और दिखाएँ',
    oldData: (d) => `हमारी सूची में सबसे ताज़ा भाव ${d} का है। यह पुराना हो सकता है, इसलिए नीचे दिए लाइव भाव भी देखें।`,
    liveTitle: 'लाइव मंडी भाव देखें',
    liveText: 'आज के लाइव भाव के लिए इन सरकारी वेबसाइट का इस्तेमाल करें:',
    note: 'मॉडल भाव उस मंडी का सबसे आम भाव होता है। भाव सिर्फ़ अंदाज़े के लिए हैं, बेचने से पहले अपनी नज़दीकी मंडी में पूछ लें।',
    adminTitle: 'एडमिन: भाव जोड़ें',
    editTitle: 'एडमिन: भाव बदलें',
    commodityEn: 'उपज (अंग्रेज़ी में)',
    commodityHi: 'उपज (हिंदी में, ज़रूरी नहीं)',
    market: 'मंडी का नाम',
    state: 'राज्य',
    save: 'भाव सेव करें',
    update: 'भाव अपडेट करें',
    cancel: 'रद्द करें',
    saving: 'सेव हो रहा है...',
    edit: 'बदलें',
    remove: 'हटाएँ',
    confirmDelete: 'यह भाव हटाना है?',
    saveError: 'सेव नहीं हो पाया। कृपया फिर से कोशिश करें।',
    expired: 'आपका सेशन खत्म हो गया है। कृपया फिर से लॉगिन करें।',
    needAdmin: 'एडमिन अनुमति ज़रूरी है।',
  },
};

const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

const emptyForm = () => ({
  commodity: '',
  commodityHi: '',
  market: '',
  district: '',
  state: 'Uttar Pradesh',
  minPrice: '',
  maxPrice: '',
  modalPrice: '',
  date: todayStr(),
});

const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function Market() {
  const { language } = useLanguage();
  const { user, token, logout } = useAuth();
  const s = text[language];
  const isAdmin = Boolean(user && user.role === 'admin');

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commodity, setCommodity] = useState('all');
  const [district, setDistrict] = useState('all');
  const [sort, setSort] = useState('high');
  const [visible, setVisible] = useState(30);

  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/market`);
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setPrices(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(s.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const nameOf = (p) => (language === 'hi' && p.commodityHi ? p.commodityHi : p.commodity);

  const commodities = useMemo(
    () => [...new Set(prices.map((p) => p.commodity))].sort(),
    [prices]
  );
  const districts = useMemo(
    () => [...new Set(prices.map((p) => p.district).filter(Boolean))].sort(),
    [prices]
  );

  const filtered = useMemo(() => {
    const list = prices.filter(
      (p) =>
        (commodity === 'all' || p.commodity === commodity) &&
        (district === 'all' || p.district === district)
    );
    return list.sort((a, b) => (sort === 'high' ? b.modalPrice - a.modalPrice : a.modalPrice - b.modalPrice));
  }, [prices, commodity, district, sort]);

  // Sabse nayi tareekh dekhkar purane data ki chetavani
  const latest = useMemo(() => {
    const dates = prices.map((p) => p.date).sort();
    return dates.length ? dates[dates.length - 1] : null;
  }, [prices]);
  const isOld = latest && (Date.now() - new Date(`${latest}T00:00:00`).getTime()) / 86400000 > 7;

  const formatDate = (str) =>
    new Date(`${str}T00:00:00`).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const res = await fetch(
        editingId ? `${API}/api/market/${editingId}` : `${API}/api/market`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();

      if (res.status === 401) {
        setFormError(s.expired);
        logout();
        return;
      }
      if (res.status === 403) {
        setFormError(s.needAdmin);
        return;
      }
      if (!res.ok) {
        setFormError(data.message || s.saveError);
        return;
      }

      resetForm();
      await load();
    } catch (err) {
      setFormError(s.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      commodity: p.commodity,
      commodityHi: p.commodityHi || '',
      market: p.market,
      district: p.district || '',
      state: p.state || 'Uttar Pradesh',
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      modalPrice: p.modalPrice,
      date: p.date,
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(s.confirmDelete)) return;
    try {
      const res = await fetch(`${API}/api/market/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('failed');
      await load();
    } catch (err) {
      setError(s.saveError);
    }
  };

  const selectClass = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800';
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold text-green-800">💰 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border-2 border-green-600 bg-white p-5 shadow">
          <h3 className="mb-3 font-bold text-green-800">
            🛠️ {editingId ? s.editTitle : s.adminTitle}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{s.commodityEn}</label>
              <input type="text" value={form.commodity} onChange={setField('commodity')} className={inputClass} placeholder="Wheat" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.commodityHi}</label>
              <input type="text" value={form.commodityHi} onChange={setField('commodityHi')} className={inputClass} placeholder="गेहूं" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.market}</label>
              <input type="text" value={form.market} onChange={setField('market')} className={inputClass} placeholder="Kanpur Mandi" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.district}</label>
              <input type="text" value={form.district} onChange={setField('district')} className={inputClass} placeholder="Kanpur Nagar" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.state}</label>
              <input type="text" value={form.state} onChange={setField('state')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.date}</label>
              <input type="date" value={form.date} onChange={setField('date')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.min} ({s.perQuintal})</label>
              <input type="number" min="0" value={form.minPrice} onChange={setField('minPrice')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.modal} ({s.perQuintal})</label>
              <input type="number" min="0" value={form.modalPrice} onChange={setField('modalPrice')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{s.max} ({s.perQuintal})</label>
              <input type="number" min="0" value={form.maxPrice} onChange={setField('maxPrice')} className={inputClass} />
            </div>
          </div>

          {formError && <p className="mt-3 text-red-600">{formError}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:opacity-60"
            >
              {saving ? s.saving : editingId ? s.update : s.save}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-green-700 px-6 py-2 font-semibold text-green-700"
              >
                {s.cancel}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-3">
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
                {c}
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
        <p className="mt-4 rounded-lg bg-yellow-100 p-3 text-yellow-900">⚠️ {s.oldData(formatDate(latest))}</p>
      )}

      {loading && <p className="mt-6 text-gray-500">{s.loading}</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="mt-6 text-gray-500">{s.noData}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, visible).map((p) => (
          <div
            key={p._id}
            className="rounded-xl bg-white p-4 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <h3 className="text-lg font-bold text-green-800">{nameOf(p)}</h3>

            <p className="mt-2 text-3xl font-bold text-green-700">{money(p.modalPrice)}</p>
            <p className="text-xs text-gray-500">
              {s.modal} · {s.perQuintal}
            </p>

            <div className="mt-3 flex justify-between text-sm">
              <span>
                {s.min}: <strong>{money(p.minPrice)}</strong>
              </span>
              <span>
                {s.max}: <strong>{money(p.maxPrice)}</strong>
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              📍 {p.market}
              {p.district ? `, ${p.district}` : ''}
            </p>
            <p className="text-xs text-gray-500">
              📅 {s.date}: {formatDate(p.date)}
            </p>

            {isAdmin && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="rounded-lg border border-green-700 px-3 py-1 text-sm font-semibold text-green-700"
                >
                  {s.edit}
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="rounded-lg border border-red-500 px-3 py-1 text-sm font-semibold text-red-600"
                >
                  {s.remove}
                </button>
              </div>
            )}
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

      <div className="mt-8 rounded-xl bg-green-50 p-5 shadow">
        <h3 className="font-bold text-green-800">🌐 {s.liveTitle}</h3>
        <p className="mt-1 text-gray-600">{s.liveText}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="https://agmarknet.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
          >
            Agmarknet ↗
          </a>
          <a
            href="https://enam.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
          >
            eNAM ↗
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500">{s.note}</p>
    </main>
  );
}

export default Market;