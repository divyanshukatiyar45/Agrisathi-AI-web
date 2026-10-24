import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const { t, language } = useLanguage();
  const { saveLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError(t('fillAllFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMin'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, location, language }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t('somethingWrong'));
      } else {
        saveLogin(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-bold text-green-800">{t('signupTitle')}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-medium">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">{t('location')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-700 p-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? t('pleaseWait') : t('signup')}
          </button>
        </form>

        <p className="mt-4 text-center">
          {t('haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-green-700">
            {t('login')}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;
