import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API = import.meta.env.VITE_API_URL;

const seasonOptions = [
  { value: 'all', key: 'allSeasons' },
  { value: 'Kharif', key: 'kharif' },
  { value: 'Rabi', key: 'rabi' },
  { value: 'Zaid', key: 'zaid' },
];

function Crops() {
  const { t, language } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [season, setSeason] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/crops`)
      .then((res) => res.json())
      .then((data) => setCrops(Array.isArray(data) ? data : []))
      .catch(() => setError(t('somethingWrong')))
      .finally(() => setLoading(false));
  }, []);

  const pick = (crop, field) =>
    language === 'hi' && crop[`${field}Hi`] ? crop[`${field}Hi`] : crop[field];

  const seasonLabel = (value) => t(value.toLowerCase());

  const visible = season === 'all' ? crops : crops.filter((c) => c.season === season);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold text-green-800">{t('cropsTitle')}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {seasonOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSeason(opt.value)}
            className={`rounded-full px-4 py-1 font-semibold ${
              season === opt.value
                ? 'bg-green-700 text-white'
                : 'bg-white text-green-700 shadow'
            }`}
          >
            {t(opt.key)}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6">{t('loading')}</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="mt-6">{t('noCrops')}</p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((crop) => (
          <div key={crop._id} className="rounded-xl bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-green-800">{pick(crop, 'name')}</h3>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                {seasonLabel(crop.season)}
              </span>
            </div>
            <p className="mt-1 text-gray-600">{pick(crop, 'description')}</p>

            <dl className="mt-3 space-y-1 text-sm">
              <div>
                <dt className="inline font-semibold">{t('soil')}: </dt>
                <dd className="inline">{pick(crop, 'soilType')}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('sowing')}: </dt>
                <dd className="inline">{pick(crop, 'sowingMonths')}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('harvest')}: </dt>
                <dd className="inline">{pick(crop, 'harvestMonths')}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('duration')}: </dt>
                <dd className="inline">
                  {crop.durationDays} {t('days')}
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('water')}: </dt>
                <dd className="inline">{pick(crop, 'waterRequirement')}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('fertilizer')}: </dt>
                <dd className="inline">{pick(crop, 'fertilizer')}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t('irrigation')}: </dt>
                <dd className="inline">{pick(crop, 'irrigationGuide')}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Crops;
