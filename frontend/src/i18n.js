import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Détection de la langue du navigateur
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
};

// Récupération de la langue sauvegardée
const savedLanguage = localStorage.getItem('language') || getBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

// Sauvegarder la langue quand elle change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  // Mettre à jour l'attribut lang du HTML
  document.documentElement.lang = lng;
});

export default i18n;
