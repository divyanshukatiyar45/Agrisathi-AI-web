import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_URL;

const navItems = [
  { to: '/', key: 'home', end: true },
  { to: '/weather', key: 'weather' },
  { to: '/crops', key: 'cropAdvisor' },
  { to: '/chat', key: 'chatbot' },
  { to: '/ask-query', key: 'askQuery' },
  { to: '/market-price', key: 'marketPrice' },
  { to: '/disease-check', key: 'diseaseCheck' },
  { to: '/schemes', key: 'schemes' },
  { to: '/nearby', key: 'nearby' },
  { to: '/reminders', key: 'reminders' },
  { to: '/help', key: 'help' },
];

function Navbar() {
  const { t, toggleLanguage } = useLanguage();
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  // Aaj ke ya late reminders ginta hai (laal badge ke liye)
  const loadDue = useCallback(async () => {
    if (!token) {
      setDueCount(0);
      return;
    }
    try {
      const res = await fetch(`${API}/api/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const today = new Date().toLocaleDateString('en-CA');
      setDueCount(data.filter((r) => !r.done && r.dueDate <= today).length);
    } catch (err) {
      // chup-chaap ignore, badge zaroori nahi
    }
  }, [token]);

  useEffect(() => {
    loadDue();
  }, [loadDue, location.pathname]);

  useEffect(() => {
    window.addEventListener('reminders-changed', loadDue);
    return () => window.removeEventListener('reminders-changed', loadDue);
  }, [loadDue]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pillClass = ({ isActive }) =>
    `relative rounded-md px-3 py-1 text-sm font-semibold transition ${
      isActive ? 'bg-[#e0b84a] text-[#3d2b05]' : 'text-white/90 hover:bg-white/15'
    }`;

  return (
    <nav className="bg-[#a67c1f] px-6 py-3 text-white shadow dark:bg-[#6b4f12]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="text-xl font-bold"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {t('appName')}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline">
                {t('hello')}, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white px-4 py-1 font-semibold"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-semibold">
                {t('login')}
              </Link>
              <Link
                to="/signup"
                className="rounded-lg border border-white px-4 py-1 font-semibold"
              >
                {t('signup')}
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            className="rounded-lg border border-white/60 px-3 py-1"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={toggleLanguage}
            className="rounded-lg bg-[#1f2a55] px-4 py-1 font-semibold text-white"
          >
            {t('switchTo')}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={pillClass}>
            {t(item.key)}
            {item.key === 'reminders' && dueCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                {dueCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;