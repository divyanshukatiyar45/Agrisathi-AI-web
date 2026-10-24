import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { t } = useLanguage();
  const { saveLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        <h2 className="mb-4 text-2xl font-bold text-green-800">{t('loginTitle')}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-700 p-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? t('pleaseWait') : t('login')}
          </button>
        </form>

        <p className="mt-4 text-center">
          {t('noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-green-700">
            {t('signup')}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
