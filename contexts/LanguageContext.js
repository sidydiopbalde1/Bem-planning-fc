import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Importation des fichiers de traduction
import fr from '../locales/fr.json';
import en from '../locales/en.json';

const translations = { fr, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('fr');
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger la langue depuis localStorage au montage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    setIsLoaded(true);
  }, []);

  // Fonction pour changer la langue
  const setLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
      localStorage.setItem('language', newLanguage);
      // Mettre à jour l'attribut lang du document
      document.documentElement.lang = newLanguage;
    }
  }, []);

  // Fonction de traduction
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Retourner la clé si la traduction n'existe pas
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key;
      }
    }

    // Remplacer les paramètres {{param}} dans la traduction
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    isLoaded,
    availableLanguages: [
      { code: 'fr', name: 'Francais', flag: 'FR' },
      { code: 'en', name: 'English', flag: 'GB' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personnalise pour utiliser le contexte
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook simplifie pour les traductions
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}

export default LanguageContext;
