// Utilitaires de gestion des dates
export const getCurrentDate = () => {
  return new Date();
};

// Obtenir le premier jour du mois
export const getFirstDayOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Obtenir le dernier jour du mois
export const getLastDayOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Obtenir la période actuelle (fin du mois précédent à fin du mois actuel)
export const getCurrentPeriod = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Si on est avant le 25 du mois, on considère la période du mois précédent
  if (now.getDate() < 25) {
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    return {
      start: new Date(previousYear, previousMonth, 25),
      end: new Date(currentYear, currentMonth, 24),
      label: `${getMonthName(previousMonth)} ${previousYear} - ${getMonthName(currentMonth)} ${currentYear}`,
    };
  } else {
    // Sinon, période du mois actuel au mois suivant
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    return {
      start: new Date(currentYear, currentMonth, 25),
      end: new Date(nextYear, nextMonth, 24),
      label: `${getMonthName(currentMonth)} ${currentYear} - ${getMonthName(nextMonth)} ${nextYear}`,
    };
  }
};

// Obtenir le nom du mois
export const getMonthName = (monthIndex, short = false) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const shortMonths = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  
  return short ? shortMonths[monthIndex] : months[monthIndex];
};

// Formater une date pour l'API (YYYY-MM-DD)
export const formatDateForAPI = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  return dateObj.toISOString().split('T')[0];
};

// Parser une date depuis l'API
export const parseDateFromAPI = (dateString) => {
  if (!dateString) {
    return null;
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};
