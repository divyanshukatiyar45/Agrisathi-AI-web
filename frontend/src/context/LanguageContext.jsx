import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => translations[language][key] || key;
  const toggleLanguage = () => setLanguage((l) => (l === 'en' ? 'hi' : 'en'));

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
