import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enResource from './locales/en-US.json';
import zhResource from './locales/zh-CN.json';

const resources = {
  en: {
    translation: enResource,
  },
  zh: {
    translation: zhResource,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en',

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export const i18next = i18n;
