import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function FeaturePage({ titleKey, icon, textKey, linkTo, linkKey }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <div className="rounded-xl bg-white p-8 shadow">
        <div className="text-6xl">{icon}</div>
        <h2 className="mt-3 text-2xl font-bold text-green-800">{t(titleKey)}</h2>
        <p className="mt-2 text-gray-600">{t(textKey || 'comingSoonText')}</p>

        {linkTo ? (
          <Link
            to={linkTo}
            className="mt-5 inline-block rounded-lg bg-green-700 px-6 py-2 font-semibold text-white"
          >
            {t(linkKey)}
          </Link>
        ) : (
          <span className="mt-5 inline-block rounded-full bg-green-100 px-4 py-1 font-semibold text-green-800">
            {t('comingSoon')}
          </span>
        )}
      </div>
    </main>
  );
}

export default FeaturePage;