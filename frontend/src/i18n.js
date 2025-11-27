// Configuration i18n avec CDN (sans npm)
// Utilise window.i18next chargé depuis unpkg.com
import React from 'react';

const translations = {
  fr: {
    translation: {
      common: {
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        cancel: "Annuler",
        save: "Enregistrer",
        delete: "Supprimer",
        edit: "Modifier",
        add: "Ajouter",
        search: "Rechercher",
        filter: "Filtrer",
        yes: "Oui",
        no: "Non",
        confirm: "Confirmer",
        close: "Fermer"
      },
      months: {
        january: "Janvier",
        february: "Février",
        march: "Mars",
        april: "Avril",
        may: "Mai",
        june: "Juin",
        july: "Juillet",
        august: "Août",
        september: "Septembre",
        october: "Octobre",
        november: "Novembre",
        december: "Décembre"
      },
      monthsShort: {
        jan: "Jan", feb: "Fév", mar: "Mar", apr: "Avr",
        may: "Mai", jun: "Jun", jul: "Jul", aug: "Aoû",
        sep: "Sep", oct: "Oct", nov: "Nov", dec: "Déc"
      },
      nav: {
        brand: "Budget App",
        dashboard: "Tableau de bord",
        transactions: "Transactions",
        addTransaction: "Ajouter",
        categories: "Catégories",
        budgets: "Budgets",
        reports: "Statistiques",
        settings: "Paramètres",
        logout: "Déconnexion"
      },
      auth: {
        login: "Connexion",
        email: "Adresse email",
        password: "Mot de passe",
        loginTitle: "Connexion",
        loginSubtitle: "Accédez à votre espace personnel",
        loginButton: "Se connecter",
        noAccount: "Pas encore de compte ?",
        registerButton: "Créer un compte"
      },
      dashboard: {
        title: "Tableau de bord",
        currentPeriod: "Période actuelle",
        income: "Revenus",
        expenses: "Dépenses",
        netBalance: "Solde",
        savings: "Économies",
        thisMonth: "Ce mois",
        topCategories: "Top catégories",
        recentTransactions: "Transactions récentes",
        noTransactions: "Aucune transaction pour cette période",
        loading: "Chargement du tableau de bord...",
        welcome: "Bienvenue dans votre tableau de bord !",
        currentPeriodLabel: "Période actuelle",
        previousPeriod: "Période précédente",
        thisYear: "Cette année",
        custom: "Personnalisée",
        refresh: "Actualiser",
        startDate: "Date début",
        endDate: "Date fin"
      }
    }
  },
  en: {
    translation: {
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        search: "Search",
        filter: "Filter",
        yes: "Yes",
        no: "No",
        confirm: "Confirm",
        close: "Close"
      },
      months: {
        january: "January",
        february: "February",
        march: "March",
        april: "April",
        may: "May",
        june: "June",
        july: "July",
        august: "August",
        september: "September",
        october: "October",
        november: "November",
        december: "December"
      },
      monthsShort: {
        jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr",
        may: "May", jun: "Jun", jul: "Jul", aug: "Aug",
        sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec"
      },
      nav: {
        brand: "Budget App",
        dashboard: "Dashboard",
        transactions: "Transactions",
        addTransaction: "Add",
        categories: "Categories",
        budgets: "Budgets",
        reports: "Reports",
        settings: "Settings",
        logout: "Logout"
      },
      auth: {
        login: "Login",
        email: "Email address",
        password: "Password",
        loginTitle: "Welcome",
        loginSubtitle: "Sign in to your account",
        loginButton: "Sign In",
        noAccount: "Don't have an account?",
        registerButton: "Create Account"
      },
      dashboard: {
        title: "Dashboard",
        currentPeriod: "Current Period",
        income: "Income",
        expenses: "Expenses",
        netBalance: "Net Balance",
        savings: "Savings",
        thisMonth: "This Month",
        topCategories: "Top Categories",
        recentTransactions: "Recent Transactions",
        noTransactions: "No transactions for this period",
        loading: "Loading dashboard...",
        welcome: "Welcome to your dashboard!",
        currentPeriodLabel: "Current Period",
        previousPeriod: "Previous Period",
        thisYear: "This Year",
        custom: "Custom",
        refresh: "Refresh",
        startDate: "Start Date",
        endDate: "End Date"
      }
    }
  }
};

// Fonction pour obtenir la langue depuis le navigateur
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
};

// Récupération de la langue sauvegardée
const savedLanguage = localStorage.getItem('language') || getBrowserLanguage();

// Initialisation i18next depuis CDN
if (window.i18next) {
  window.i18next.init({
    lng: savedLanguage,
    fallbackLng: 'fr',
    resources: translations,
    interpolation: {
      escapeValue: false
    }
  });

  // Sauvegarder la langue quand elle change
  window.i18next.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  });
}

// Export pour utilisation dans React
export const i18n = window.i18next;

// Helper pour utiliser dans les composants React
export const useTranslation = () => {
  const [, forceUpdate] = React.useState();
  
  React.useEffect(() => {
    const handleLanguageChanged = () => {
      forceUpdate({});
    };
    
    i18n?.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n?.off('languageChanged', handleLanguageChanged);
    };
  }, []);
  
  return {
    t: (key) => i18n?.t(key) || key,
    i18n: i18n
  };
};

// Helper pour changer de langue
export const changeLanguage = (lng) => {
  if (i18n) {
    i18n.changeLanguage(lng);
  }
};

// Helper pour obtenir le nom du mois traduit
export const getMonthName = (monthIndex, short = false) => {
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const namespace = short ? 'monthsShort' : 'months';
  const key = short ? monthKeys[monthIndex].substring(0, 3) : monthKeys[monthIndex];
  
  return i18n?.t(`${namespace}.${key}`) || monthKeys[monthIndex];
};

export default i18n;
