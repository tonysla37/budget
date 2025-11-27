import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage} 
      className="language-switcher"
      title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe size={16} />
      <span className="language-label">{i18n.language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;
