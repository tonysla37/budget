import { apiCall } from '../config/api.config';

// Récupérer tous les budgets
export const getBudgets = async (periodType = 'monthly') => {
  try {
    return await apiCall(`/api/budgets/?period_type=${periodType}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des budgets:', error);
    throw error;
  }
};

// Créer un nouveau budget
export const createBudget = async (budgetData) => {
  try {
    return await apiCall('/api/budgets/', {
      method: 'POST',
      body: JSON.stringify(budgetData)
    });
  } catch (error) {
    console.error('Erreur lors de la création du budget:', error);
    throw error;
  }
};

// Mettre à jour un budget
export const updateBudget = async (budgetId, budgetData) => {
  try {
    return await apiCall(`/api/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du budget:', error);
    throw error;
  }
};

// Supprimer un budget
export const deleteBudget = async (budgetId) => {
  try {
    await apiCall(`/api/budgets/${budgetId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du budget:', error);
    throw error;
  }
};
