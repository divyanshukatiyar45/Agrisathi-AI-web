import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const API = import.meta.env.VITE_API_URL;

function Weather() {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('Kanpur');
  const [city, setCity] = useState('Kanpur');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const q = `city=${encodeURIComponent(city)}&lang=${language}`;
        const [curRes, foreRes] = await Promise.all([
          fetch(`${API}/api/weather/current?${q}`),
          fetch(`${API}/api/weather/forecast?${q}`),
        ]);
        const curData = await curRes.json();
        const foreData = await foreRes.json();

        if (!curRes.ok) throw new Error(curData.message);
        if (!foreRes.ok) throw new Error(foreData.message);

        setCurrent(curData);
        setForecast(foreData.forecast);
      } catch (err) {
        setCurrent(null);
        setForecast([]);
        const msg = err.message || '';
        setError(msg.includes('Invalid API key') ? t('apiKeyPending') : msg || t('weatherError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city, language]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setCity(input.trim());
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('searchCity')}
          className="flex-1 rounded-lg border border-gray-300 bg-white p-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
        >
          {t('search')}
        </button>
      </form>

      {loading && <p className="mt-6">{t('loading')}</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      {current && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-600">{t('currentWeather')}</h2>
          <div className="mt-2 flex items-center gap-4">
            <img
              src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
              alt={current.description}
              className="h-20 w-20"
            />
            <div>
              <p className="text-2xl font-bold text-green-800">{current.city}</p>
              <p className="text-4xl font-bold">{Math.round(current.temperature)}°C</p>
              <p className="capitalize text-gray-600">{current.description}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-gray-600">{t('feelsLike')}</p>
              <p className="font-bold">{Math.round(current.feelsLike)}°C</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-gray-600">{t('humidity')}</p>
              <p className="font-bold">{current.humidity}%</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-gray-600">{t('wind')}</p>
              <p className="font-bold">{current.windSpeed} m/s</p>
            </div>
          </div>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-600">{t('forecast')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {forecast.map((day) => (
              <div key={day.date} className="rounded-xl bg-white p-3 text-center shadow">
                <p className="font-semibold">{formatDate(day.date)}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt={day.description}
                  className="mx-auto h-12 w-12"
                />
                <p className="text-xl font-bold">{Math.round(day.temperature)}°C</p>
                <p className="text-sm capitalize text-gray-600">{day.description}</p>
                <p className="mt-1 text-sm text-blue-700">
                  {t('rainChance')}: {day.rainChance}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default Weather;
