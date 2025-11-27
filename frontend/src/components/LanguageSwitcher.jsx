import React from 'react';
import { Globe } from 'lucide-react';
import { changeLanguage, i18n } from '../i18n';

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = React.useState(i18n?.language || 'fr');

  const toggleLanguage = () => {
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    changeLanguage(newLang);
    setCurrentLang(newLang);
  };

  return (
    <button 
      onClick={toggleLanguage} 
      className="language-switcher"
      title={currentLang === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe size={16} />
      <span className="language-label">{currentLang.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;
