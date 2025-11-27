import { apiCall } from '../config/api.config';

// Récupérer les données du dashboard
export const getDashboardData = async (period = 'current', startDate = null, endDate = null) => {
  try {
    let url = `/api/dashboard/?period=${period}`;
    if (period === 'custom' && startDate && endDate) {
      url = `/api/dashboard/?start_date=${startDate}&end_date=${endDate}`;
    }
    console.log('📡 Appel API dashboard:', url);
    const result = await apiCall(url);
    console.log('📦 Réponse API dashboard:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur API dashboard:', error);
    throw error;
  }
};

// Récupérer les données du dashboard par mois
export const getMonthlyDashboard = async (year, month) => {
  try {
    return await apiCall(`/api/dashboard/monthly?year=${year}&month=${month}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des données mensuelles:', error);
    throw error;
  }
};

// Récupérer les données du dashboard par catégorie
export const getCategoryDashboard = async (period = 'current') => {
  try {
    return await apiCall(`/api/dashboard/by-category?period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des données par catégorie:', error);
    throw error;
  }
};

// Récupérer les tendances
export const getTrends = async (period = 'current') => {
  try {
    return await apiCall(`/api/dashboard/trends?period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des tendances:', error);
    throw error;
  }
};

// Récupérer les alertes budgétaires
export const getBudgetAlerts = async () => {
  try {
    return await apiCall('/api/dashboard/alerts');
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw error;
  }
};
