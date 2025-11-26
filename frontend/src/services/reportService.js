import { apiCall } from '../config/api.config';

// Récupérer le rapport mensuel
export const getMonthlyReports = async (year, month) => {
  try {
    return await apiCall(`/api/reports/monthly/${year}/${month}`);
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport mensuel:', error);
    throw error;
  }
};

// Récupérer le rapport pour une période
export const getPeriodReport = async (startDate, endDate) => {
  try {
    return await apiCall(`/api/reports/period?start_date=${startDate}&end_date=${endDate}`);
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de période:', error);
    throw error;
  }
};
