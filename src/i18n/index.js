import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import gu from './locales/gu.json';
import ta from './locales/ta.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  gu: { translation: gu },
  ta: { translation: ta },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;