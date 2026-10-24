import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_URL;

const text = {
  en: {
    title: 'My Reminders',
    intro: 'Never miss irrigation, fertilizer or other farm work.',
    loginNeeded: 'Please login to use reminders.',
    addTitle: 'Add a reminder',
    what: 'What is it for?',
    crop: 'Crop (optional)',
    noCrop: 'No crop',
    date: 'Date',
    repeat: 'Repeat',
    noRepeat: 'No repeat',
    every: (n) => `Every ${n} days`,
    note: 'Note (optional)',
    notePlaceholder: 'Example: Field near the canal',
    add: 'Add reminder',
    saving: 'Saving...',
    overdue: 'Overdue',
    today: 'Due today',
    upcoming: 'Upcoming',
    completed: 'Completed',
    none: 'No reminders yet. Add your first one above.',
    done: 'Mark done',
    remove: 'Delete',
    confirmDelete: 'Delete this reminder?',
    needDate: 'Please choose a date.',
    needNote: 'Please write a note for "Other".',
    loadError: 'Could not load reminders. Please try again.',
    saveError: 'Could not save. Please try again.',
    expired: 'Your session has expired. Please login again.',
    loading: 'Loading...',
    tip: 'Tip: check the Crop Guide to see when your crop needs irrigation and fertilizer.',
  },
  hi: {
    title: 'मेरे रिमाइंडर',
    intro: 'सिंचाई, खाद या खेत का कोई भी काम कभी न भूलें।',
    loginNeeded: 'रिमाइंडर इस्तेमाल करने के लिए कृपया लॉगिन करें।',
    addTitle: 'रिमाइंडर जोड़ें',
    what: 'किस काम के लिए?',
    crop: 'फसल (ज़रूरी नहीं)',
    noCrop: 'कोई फसल नहीं',
    date: 'तारीख',
    repeat: 'दोहराएँ',
    noRepeat: 'दोहराना नहीं',
    every: (n) => `हर ${n} दिन`,
    note: 'नोट (ज़रूरी नहीं)',
    notePlaceholder: 'उदाहरण: नहर के पास वाला खेत',
    add: 'रिमाइंडर जोड़ें',
    saving: 'सेव हो रहा है...',
    overdue: 'देर हो चुकी',
    today: 'आज का काम',
    upcoming: 'आने वाले',
    completed: 'पूरे हुए',
    none: 'अभी कोई रिमाइंडर नहीं है। ऊपर से पहला जोड़ें।',
    done: 'हो गया',
    remove: 'हटाएँ',
    confirmDelete: 'यह रिमाइंडर हटाना है?',
    needDate: 'कृपया तारीख चुनें।',
    needNote: '"अन्य" के लिए कृपया नोट लिखें।',
    loadError: 'रिमाइंडर लोड नहीं हो पाए। कृपया फिर से कोशिश करें।',
    saveError: 'सेव नहीं हो पाया। कृपया फिर से कोशिश करें।',
    expired: 'आपका सेशन खत्म हो गया है। कृपया फिर से लॉगिन करें।',
    loading: 'लोड हो रहा है...',
    tip: 'सुझाव: आपकी फसल को सिंचाई और खाद कब चाहिए, यह फसल गाइड में देखें।',
  },
};

const types = [
  { value: 'irrigation', icon: '💧', en: 'Irrigation', hi: 'सिंचाई' },
  { value: 'fertilizer', icon: '🧪', en: 'Fertilizer', hi: 'खाद' },
  { value: 'sowing', icon: '🌱', en: 'Sowing', hi: 'बुवाई' },
  { value: 'harvest', icon: '🌾', en: 'Harvest', hi: 'कटाई' },
  { value: 'pest', icon: '🐛', en: 'Pest check', hi: 'कीट जाँच' },
  { value: 'other', icon: '📌', en: 'Other', hi: 'अन्य' },
];

const repeatOptions = [0, 7, 10, 15, 20, 30];

const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

function Reminders() {
  const { language } = useLanguage();
  const { token, logout } = useAuth();
  const { theme } = useTheme();
  const s = text[language];

  const [reminders, setReminders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState('irrigation');
  const [crop, setCrop] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [repeat, setRepeat] = useState(0);
  const [note, setNote] = useState('');

  const notifyNavbar = () => window.dispatchEvent(new Event('reminders-changed'));

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [remRes, cropRes] = await Promise.all([
        fetch(`${API}/api/reminders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/crops`),
      ]);

      if (remRes.status === 401) {
        setError(s.expired);
        logout();
        return;
      }
      if (!remRes.ok) throw new Error('load failed');

      setReminders(await remRes.json());
      const cropData = await cropRes.json();
      setCrops(Array.isArray(cropData) ? cropData : []);
    } catch (err) {
      setError(s.loadError);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!dueDate) {
      setError(s.needDate);
      return;
    }
    if (type === 'other' && !note.trim()) {
      setError(s.needNote);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/reminders`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type,
          crop,
          dueDate,
          repeatEveryDays: repeat,
          note: note.trim(),
        }),
      });

      if (res.status === 401) {
        setError(s.expired);
        logout();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || s.saveError);
        return;
      }

      setNote('');
      setCrop('');
      setRepeat(0);
      setDueDate(todayStr());
      await load();
      notifyNavbar();
    } catch (err) {
      setError(s.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API}/api/reminders/${id}/done`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ today: todayStr() }),
      });
      if (!res.ok) throw new Error('failed');
      await load();
      notifyNavbar();
    } catch (err) {
      setError(s.saveError);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(s.confirmDelete)) return;
    setError('');
    try {
      const res = await fetch(`${API}/api/reminders/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('failed');
      await load();
      notifyNavbar();
    } catch (err) {
      setError(s.saveError);
    }
  };

  const cropLabel = (name) => {
    const c = crops.find((x) => x.name === name);
    return language === 'hi' && c ? c.nameHi : name;
  };

  const titleOf = (r) => {
    const tp = types.find((x) => x.value === r.type);
    return `${tp.icon} ${tp[language]}${r.crop ? ` – ${cropLabel(r.crop)}` : ''}`;
  };

  const formatDate = (str) =>
    new Date(`${str}T00:00:00`).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const today = todayStr();
  const active = reminders.filter((r) => !r.done);
  const overdue = active.filter((r) => r.dueDate < today);
  const dueToday = active.filter((r) => r.dueDate === today);
  const upcoming = active.filter((r) => r.dueDate > today);
  const completed = reminders.filter((r) => r.done);

  const Card = ({ r, color, canDone }) => (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-l-4 bg-white p-4 shadow ${color}`}>
      <div>
        <p className="font-bold text-green-800">{titleOf(r)}</p>
        <p className="text-sm text-gray-600">
          📅 {formatDate(r.dueDate)}
          {r.repeatEveryDays > 0 && ` · 🔁 ${s.every(r.repeatEveryDays)}`}
        </p>
        {r.note && <p className="mt-1 text-sm text-gray-500">{r.note}</p>}
      </div>
      <div className="flex gap-2">
        {canDone && (
          <button
            onClick={() => handleDone(r._id)}
            className="rounded-lg bg-green-700 px-4 py-1 font-semibold text-white"
          >
            ✓ {s.done}
          </button>
        )}
        <button
          onClick={() => handleDelete(r._id)}
          className="rounded-lg border border-red-500 px-3 py-1 font-semibold text-red-600"
        >
          {s.remove}
        </button>
      </div>
    </div>
  );

  const Section = ({ title, items, color, canDone = true }) =>
    items.length > 0 && (
      <section className="mt-6">
        <h3 className="mb-2 text-lg font-bold text-green-800">
          {title} ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r._id} r={r} color={color} canDone={canDone} />
          ))}
        </div>
      </section>
    );

  const pill = (selected) =>
    `rounded-full px-4 py-1 font-semibold ${
      selected ? 'bg-green-700 text-white' : 'border border-green-700 text-green-700'
    }`;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-bold text-green-800">🔔 {s.title}</h2>
      <p className="mt-1 text-gray-600">{s.intro}</p>

      <form onSubmit={handleAdd} className="mt-4 rounded-xl bg-white p-5 shadow">
        <h3 className="mb-3 font-bold text-green-800">{s.addTitle}</h3>

        <label className="mb-2 block font-medium">{s.what}</label>
        <div className="flex flex-wrap gap-2">
          {types.map((tp) => (
            <button
              key={tp.value}
              type="button"
              onClick={() => setType(tp.value)}
              className={pill(type === tp.value)}
            >
              {tp.icon} {tp[language]}
            </button>
          ))}
        </div>

        {crops.length > 0 && (
          <>
            <label className="mb-2 mt-4 block font-medium">{s.crop}</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCrop('')} className={pill(crop === '')}>
                {s.noCrop}
              </button>
              {crops.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setCrop(c.name)}
                  className={pill(crop === c.name)}
                >
                  {language === 'hi' ? c.nameHi : c.name}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="mb-1 mt-4 block font-medium">{s.date}</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
          className="rounded-lg border border-gray-300 bg-transparent p-2"
        />

        <label className="mb-2 mt-4 block font-medium">{s.repeat}</label>
        <div className="flex flex-wrap gap-2">
          {repeatOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRepeat(n)}
              className={pill(repeat === n)}
            >
              {n === 0 ? s.noRepeat : s.every(n)}
            </button>
          ))}
        </div>

        <label className="mb-1 mt-4 block font-medium">{s.note}</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={s.notePlaceholder}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-2"
        />

        {error && <p className="mt-3 text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-green-700 px-6 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? s.saving : s.add}
        </button>
      </form>

      {loading && <p className="mt-6 text-gray-500">{s.loading}</p>}

      {!loading && reminders.length === 0 && (
        <p className="mt-6 text-gray-500">{s.none}</p>
      )}

      <Section title={`⚠️ ${s.overdue}`} items={overdue} color="border-red-500" />
      <Section title={`📍 ${s.today}`} items={dueToday} color="border-yellow-500" />
      <Section title={`🗓️ ${s.upcoming}`} items={upcoming} color="border-green-500" />
      <Section title={`✅ ${s.completed}`} items={completed} color="border-gray-400" canDone={false} />

      <p className="mt-8 text-sm text-gray-500">{s.tip}</p>
    </main>
  );
}

export default Reminders;