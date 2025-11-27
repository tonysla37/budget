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
        registerButton: "Créer un compte",
        emailPlaceholder: "votre@email.com",
        passwordPlaceholder: "Votre mot de passe",
        confirmPasswordPlaceholder: "Confirmez votre mot de passe",
        firstNamePlaceholder: "Votre prénom",
        lastNamePlaceholder: "Votre nom",
      },
      dashboard: {
        title: "Tableau de bord",
        currentPeriod: "Période actuelle",
        income: "Revenus",
        expenses: "Dépenses",
        netBalance: "Solde",
        savings: "Économies",
        thisMonth: "Ce mois",
        net: "Net",
        potential: "Potentielle",
        objective: "Objectif",
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
        endDate: "Date fin",
        quickActions: "Actions rapides",
        addTransaction: "Ajouter une transaction",
        manageCategories: "Gérer les catégories",
        viewReports: "Voir les rapports",
        expensesByCategory: "Dépenses par catégorie",
        incomeByCategory: "Revenus par catégorie",
        viewAll: "Voir tout",
        welcomeMessage: "Bienvenue dans votre tableau de bord !",
        welcomeSubtitle: "Commencez par ajouter vos premières transactions pour voir vos statistiques ici.",
        addFirstTransaction: "Ajouter ma première transaction",
        noCategory: "Sans catégorie",
        others: "Autres"
      },
      transactions: {
        title: "Transactions",
        loading: "Chargement des transactions...",
        filters: "Filtres",
        add: "Ajouter",
        searchPlaceholder: "Rechercher des transactions...",
        noResults: "Aucune transaction trouvée",
        noTransactions: "Aucune transaction",
        addFirst: "Ajouter votre première transaction",
        typeLabel: "Type de transaction",
        typeAll: "Toutes",
        typeExpenses: "Dépenses",
        typeIncome: "Revenus",
        periodLabel: "Période",
        periodAll: "Toutes",
        periodCurrent: "Mois en cours",
        periodLast: "Mois dernier",
        periodYear: "Cette année",
        periodCustom: "Personnalisée",
        startDateLabel: "Date de début",
        startDatePlaceholder: "Date début",
        endDateLabel: "Date de fin",
        endDatePlaceholder: "Date fin",
        resetFilters: "Réinitialiser les filtres",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette transaction ?",
        editTitle: "Modifier",
        deleteTitle: "Supprimer",
        descriptionPlaceholder: "Ex: Courses alimentaires",
        merchantPlaceholder: "Ex: SNCF, Carrefour, EDF...",
        merchantLabel: "Commerçant (optionnel)",
        amountPlaceholder: "0.00",
        deleteError: "Impossible de supprimer la transaction",
        editButton: "Modifier",
        deleteButton: "Supprimer",
        count: "{{count}} sur {{total}} transaction",
        count_plural: "{{count}} sur {{total}} transactions",
        errorLoading: "Erreur lors du chargement des catégories",
        noCategory: "Sans catégorie"
      },
      addTransaction: {
        title: "Nouvelle transaction",
        typeLabel: "Type",
        typeExpense: "Dépense",
        typeIncome: "Revenu",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Ex: Courses alimentaires",
        merchantLabel: "Commerçant (optionnel)",
        merchantPlaceholder: "Ex: SNCF, Carrefour, EDF...",
        amountLabel: "Montant (€)",
        amountPlaceholder: "0.00",
        dateLabel: "Date",
        categoryLabel: "Catégorie",
        cancel: "Annuler",
        create: "Créer la transaction",
        creating: "Création...",
        errorRequired: "Veuillez remplir tous les champs obligatoires",
        errorAmount: "Veuillez entrer un montant valide",
        errorCreate: "Impossible de créer la transaction"
      },
      categories: {
        title: "Catégories",
        loading: "Chargement...",
        add: "Ajouter une catégorie",
        addSub: "Ajouter sous-catégorie",
        addSubcategory: "Ajouter une sous-catégorie",
        edit: "Modifier",
        delete: "Supprimer",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
        deleteError: "Impossible de supprimer la catégorie",
        saveError: "Impossible de sauvegarder la catégorie",
        modalTitle: "Nouvelle catégorie",
        modalTitleEdit: "Modifier la catégorie",
        nameLabel: "Nom de la catégorie",
        namePlaceholder: "Ex: Courses, Transport, Loisirs...",
        typeLabel: "Type",
        typeExpense: "Dépense",
        typeIncome: "Revenu",
        colorLabel: "Couleur",
        parentLabel: "Catégorie parente (optionnel)",
        parentNone: "Aucune (catégorie principale)",
        cancel: "Annuler",
        save: "Sauvegarder",
        subcategories: "sous-catégories",
        typeInherited: "Le type est hérité de la catégorie parente",
        customColor: "Couleur personnalisée",
        predefinedColors: "Couleurs prédéfinies",
        categoryLabel: "Catégorie *",
        selectCategory: "Sélectionner une catégorie",
        noCategories: "Aucune catégorie disponible",
        categoryCount: "catégorie",
        categoryCountPlural: "catégories",
        subcategoryHint: "Créez une sous-catégorie pour mieux organiser vos budgets",
      },
      budgets: {
        title: "Budgets",
        subtitle: "Gérez vos budgets par catégorie et suivez vos dépenses",
        loading: "Chargement...",
        add: "Ajouter un budget",
        edit: "Modifier",
        delete: "Supprimer",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce budget ?",
        modalTitle: "Nouveau budget",
        modalTitleEdit: "Modifier le budget",
        categoryLabel: "Catégorie",
        categoryPlaceholder: "Sélectionnez une catégorie",
        amountLabel: "Montant mensuel",
        amountPlaceholder: "0.00",
        periodLabel: "Période",
        periodMonthly: "Mensuel",
        periodYearly: "Annuel",
        cancel: "Annuler",
        save: "Sauvegarder",
        spent: "Dépensé",
        remaining: "Restant",
        exceeded: "Dépassé de",
        statusOk: "OK",
        statusWarning: "Attention",
        statusDanger: "Dépassé",
        showTransactions: "Voir les transactions",
        hideTransactions: "Masquer les transactions",
        noTransactions: "Aucune transaction pour ce budget",
        errorCreate: "Une erreur est survenue",
        allocated: "Budget alloué",
        currentMonthTransactions: "Transactions du mois en cours"
      },
      reports: {
        title: "Statistiques et Rapports",
        subtitle: "Évolution sur 6 mois",
        loading: "Chargement des statistiques...",
        noData: "Aucune donnée disponible",
        noDataSubtitle: "Aucune statistique n'a pu être chargée pour les 6 derniers mois.",
        totalIncome: "Total des revenus",
        totalExpenses: "Total des dépenses",
        totalSavings: "Total épargné",
        avgIncome: "Revenu moyen",
        avgExpenses: "Dépenses moyennes",
        savingsRate: "Taux d'épargne",
        evolution: "Évolution",
        metricNet: "Solde net",
        metricExpenses: "Dépenses",
        metricIncome: "Revenus",
        metricSavings: "Épargne",
        monthlyChart: "Graphique mensuel",
        totalIncomeLabel: "Revenus totaux",
        totalExpensesLabel: "Dépenses totales",
        avgMonthly: "Moyenne :",
        avgMonthlyShort: "Moyenne",
        perMonth: "/mois",
        savingsLabel: "Économies",
        savingsRateLabel: "Taux d'épargne :",
        monthlyEvolution: "Évolution mensuelle",
        detailsByMonth: "Détails par mois",
        monthColumn: "Mois",
        incomeColumn: "Revenus",
        expensesColumn: "Dépenses",
        monthlyNetColumn: "Solde du mois",
        cumulativeBalanceColumn: "Solde cumulé",
        savingsColumn: "Économies",
        savingsRateColumn: "Tx. épargne",
      },
      settings: {
        title: "Paramètres",
        subtitle: "Gérer votre profil et vos préférences",
        loading: "Chargement...",
        saving: "Sauvegarde...",
        save: "Sauvegarder les modifications",
        logout: "Se déconnecter",
        logoutConfirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
        successMessage: "Paramètres sauvegardés avec succès !",
        errorMessage: "Erreur lors de la sauvegarde des paramètres",
        errorLoading: "Impossible de charger le profil",
        profileTitle: "Informations personnelles",
        emailLabel: "Email",
        emailNote: "L'email ne peut pas être modifié",
        firstNameLabel: "Prénom",
        firstNamePlaceholder: "Votre prénom",
        lastNameLabel: "Nom",
        lastNamePlaceholder: "Votre nom",
        billingTitle: "Période de référence",
        billingSubtitle: "Définissez le jour de début de votre cycle budgétaire mensuel",
        billingDayLabel: "Jour de début du cycle",
        billingDayOption: "Le {{day}} de chaque mois",
        billingNote: "Par exemple, si vous êtes payé le 25, sélectionnez \"Le 25 de chaque mois\"",
        currentPeriod: "Votre période actuelle :",
        periodFrom: "Du",
        periodTo: "au",
        howItWorks: "Comment ça fonctionne ?",
        howItWorksItems: [
          "Le filtre \"Mois en cours\" utilisera votre cycle personnalisé",
          "Le filtre \"Mois dernier\" utilisera le cycle précédent",
          "Les statistiques du tableau de bord s'adapteront automatiquement"
        ]
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
        registerButton: "Create Account",
        emailPlaceholder: "your@email.com",
        passwordPlaceholder: "Your password",
        confirmPasswordPlaceholder: "Confirm your password",
        firstNamePlaceholder: "Your first name",
        lastNamePlaceholder: "Your last name",
      },
      dashboard: {
        title: "Dashboard",
        currentPeriod: "Current Period",
        income: "Income",
        expenses: "Expenses",
        netBalance: "Net Balance",
        savings: "Savings",
        thisMonth: "This Month",
        net: "Net",
        potential: "Potential",
        objective: "Goal",
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
        endDate: "End Date",
        quickActions: "Quick Actions",
        addTransaction: "Add a transaction",
        manageCategories: "Manage categories",
        viewReports: "View reports",
        expensesByCategory: "Expenses by category",
        incomeByCategory: "Income by category",
        viewAll: "View all",
        welcomeMessage: "Welcome to your dashboard!",
        welcomeSubtitle: "Start by adding your first transactions to see your statistics here.",
        addFirstTransaction: "Add my first transaction",
        noCategory: "No category",
        others: "Others"
      },
      transactions: {
        title: "Transactions",
        loading: "Loading transactions...",
        filters: "Filters",
        add: "Add",
        searchPlaceholder: "Search transactions...",
        noResults: "No transactions found",
        noTransactions: "No transactions",
        addFirst: "Add your first transaction",
        typeLabel: "Transaction type",
        typeAll: "All",
        typeExpenses: "Expenses",
        typeIncome: "Income",
        periodLabel: "Period",
        periodAll: "All",
        periodCurrent: "Current month",
        periodLast: "Last month",
        periodYear: "This year",
        periodCustom: "Custom",
        startDateLabel: "Start date",
        startDatePlaceholder: "Start date",
        endDateLabel: "End date",
        endDatePlaceholder: "End date",
        resetFilters: "Reset filters",
        deleteConfirm: "Are you sure you want to delete this transaction?",
        editTitle: "Edit",
        deleteTitle: "Delete",
        descriptionPlaceholder: "E.g.: Groceries",
        merchantPlaceholder: "E.g.: SNCF, Carrefour, EDF...",
        merchantLabel: "Merchant (optional)",
        amountPlaceholder: "0.00",
        deleteError: "Unable to delete transaction",
        editButton: "Edit",
        deleteButton: "Delete",
        count: "{{count}} of {{total}} transaction",
        count_plural: "{{count}} of {{total}} transactions",
        errorLoading: "Error loading categories",
        noCategory: "No category"
      },
      addTransaction: {
        title: "New transaction",
        typeLabel: "Type",
        typeExpense: "Expense",
        typeIncome: "Income",
        descriptionLabel: "Description",
        descriptionPlaceholder: "E.g.: Groceries",
        merchantLabel: "Merchant (optional)",
        merchantPlaceholder: "E.g.: SNCF, Carrefour, EDF...",
        amountLabel: "Amount (€)",
        amountPlaceholder: "0.00",
        dateLabel: "Date",
        categoryLabel: "Category",
        cancel: "Cancel",
        create: "Create transaction",
        creating: "Creating...",
        errorRequired: "Please fill in all required fields",
        errorAmount: "Please enter a valid amount",
        errorCreate: "Unable to create transaction"
      },
      categories: {
        title: "Categories",
        loading: "Loading...",
        add: "Add category",
        addSub: "Add subcategory",
        addSubcategory: "Add a subcategory",
        edit: "Edit",
        delete: "Delete",
        deleteConfirm: "Are you sure you want to delete this category?",
        deleteError: "Unable to delete category",
        saveError: "Unable to save category",
        modalTitle: "New category",
        modalTitleEdit: "Edit category",
        nameLabel: "Category name",
        namePlaceholder: "E.g.: Groceries, Transport, Leisure...",
        typeLabel: "Type",
        typeExpense: "Expense",
        typeIncome: "Income",
        colorLabel: "Color",
        parentLabel: "Parent category (optional)",
        parentNone: "None (main category)",
        cancel: "Cancel",
        save: "Save",
        subcategories: "subcategories",
        typeInherited: "Type is inherited from parent category",
        customColor: "Custom color",
        predefinedColors: "Predefined colors",
        categoryLabel: "Category *",
        selectCategory: "Select a category",
        noCategories: "No categories available",
        categoryCount: "category",
        categoryCountPlural: "categories",
        subcategoryHint: "Create a subcategory to better organize your budgets",
      },
      budgets: {
        title: "Budgets",
        subtitle: "Manage your budgets by category and track your expenses",
        loading: "Loading...",
        add: "Add budget",
        edit: "Edit",
        delete: "Delete",
        deleteConfirm: "Are you sure you want to delete this budget?",
        modalTitle: "New budget",
        modalTitleEdit: "Edit budget",
        categoryLabel: "Category",
        categoryPlaceholder: "Select a category",
        amountLabel: "Monthly amount",
        amountPlaceholder: "0.00",
        periodLabel: "Period",
        periodMonthly: "Monthly",
        periodYearly: "Yearly",
        cancel: "Cancel",
        save: "Save",
        spent: "Spent",
        remaining: "Remaining",
        exceeded: "Exceeded by",
        statusOk: "OK",
        statusWarning: "Warning",
        statusDanger: "Exceeded",
        showTransactions: "Show transactions",
        hideTransactions: "Hide transactions",
        noTransactions: "No transactions for this budget",
        errorCreate: "An error occurred",
        allocated: "Allocated budget",
        currentMonthTransactions: "Current month transactions"
      },
      reports: {
        title: "Statistics and Reports",
        subtitle: "6-month evolution",
        loading: "Loading statistics...",
        noData: "No data available",
        noDataSubtitle: "No statistics could be loaded for the last 6 months.",
        totalIncome: "Total income",
        totalExpenses: "Total expenses",
        totalSavings: "Total saved",
        avgIncome: "Average income",
        avgExpenses: "Average expenses",
        savingsRate: "Savings rate",
        evolution: "Evolution",
        metricNet: "Net balance",
        metricExpenses: "Expenses",
        metricIncome: "Income",
        metricSavings: "Savings",
        monthlyChart: "Monthly chart",
        totalIncomeLabel: "Total income",
        totalExpensesLabel: "Total expenses",
        avgMonthly: "Average:",
        avgMonthlyShort: "Average",
        perMonth: "/month",
        savingsLabel: "Savings",
        savingsRateLabel: "Savings rate:",
        monthlyEvolution: "Monthly evolution",
        detailsByMonth: "Details by month",
        monthColumn: "Month",
        incomeColumn: "Income",
        expensesColumn: "Expenses",
        monthlyNetColumn: "Monthly balance",
        cumulativeBalanceColumn: "Cumulative balance",
        savingsColumn: "Savings",
        savingsRateColumn: "Savings rate",
      },
      settings: {
        title: "Settings",
        subtitle: "Manage your profile and preferences",
        loading: "Loading...",
        saving: "Saving...",
        save: "Save changes",
        logout: "Sign out",
        logoutConfirm: "Are you sure you want to sign out?",
        successMessage: "Settings saved successfully!",
        errorMessage: "Error saving settings",
        errorLoading: "Unable to load profile",
        profileTitle: "Personal information",
        emailLabel: "Email",
        emailNote: "Email cannot be changed",
        firstNameLabel: "First name",
        firstNamePlaceholder: "Your first name",
        lastNameLabel: "Last name",
        lastNamePlaceholder: "Your last name",
        billingTitle: "Reference period",
        billingSubtitle: "Set the start day of your monthly billing cycle",
        billingDayLabel: "Cycle start day",
        billingDayOption: "The {{day}} of each month",
        billingNote: "For example, if you get paid on the 25th, select \"The 25th of each month\"",
        currentPeriod: "Your current period:",
        periodFrom: "From",
        periodTo: "to",
        howItWorks: "How it works?",
        howItWorksItems: [
          "The \"Current month\" filter will use your custom cycle",
          "The \"Last month\" filter will use the previous cycle",
          "Dashboard statistics will adapt automatically"
        ]
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

// Fonction de traduction directe
export const t = (key) => {
  return i18n?.t(key) || key;
};

// Helper pour utiliser dans les composants React
export const useTranslation = () => {
  const [, forceUpdate] = React.useState();
  
  React.useEffect(() => {
    const handleLanguageChanged = () => {
      forceUpdate({});
    };
    
    // Écouter l'événement i18next natif
    i18n?.on('languageChanged', handleLanguageChanged);
    
    // Écouter aussi notre événement custom du LanguageSwitcher
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n?.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('languageChanged', handleLanguageChanged);
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
