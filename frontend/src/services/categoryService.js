import { apiCall } from '../config/api.config';

// Récupérer toutes les catégories
export const getCategories = async (type = null) => {
  try {
    const params = type ? `?type=${type}` : '';
    return await apiCall(`/api/categories${params}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    throw error;
  }
};

// Récupérer une catégorie par ID
export const getCategoryById = async (id) => {
  try {
    return await apiCall(`/api/categories/${id}`);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    throw error;
  }
};

// Créer une nouvelle catégorie
export const createCategory = async (categoryData) => {
  try {
    return await apiCall('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    throw error;
  }
};

// Mettre à jour une catégorie
export const updateCategory = async (id, categoryData) => {
  try {
    return await apiCall(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    throw error;
  }
};

// Supprimer une catégorie
export const deleteCategory = async (id) => {
  try {
    return await apiCall(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    throw error;
  }
};

// Récupérer les statistiques d'une catégorie
export const getCategoryStats = async (id, period = 'current') => {
  try {
    return await apiCall(`/api/categories/${id}/stats?period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

// Récupérer les transactions d'une catégorie
export const getCategoryTransactions = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `/api/categories/${id}/transactions${queryParams ? `?${queryParams}` : ''}`;
    return await apiCall(url);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    throw error;
  }
};

// Récupérer les catégories par type (revenus/dépenses)
export const getCategoriesByType = async (type) => {
  try {
    return await apiCall(`/api/categories?type=${type}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories par type:', error);
    throw error;
  }
};

// Récupérer les catégories les plus utilisées
export const getTopCategories = async (limit = 10, period = 'current') => {
  try {
    return await apiCall(`/api/categories/top?limit=${limit}&period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories populaires:', error);
    throw error;
  }
};

// Vérifier si une catégorie peut être supprimée
export const canDeleteCategory = async (id) => {
  try {
    return await apiCall(`/api/categories/${id}/can-delete`);
  } catch (error) {
    console.error('Erreur lors de la vérification de suppression:', error);
    throw error;
  }
};

// Récupérer les suggestions de catégories
export const getCategorySuggestions = async (query) => {
  try {
    return await apiCall(`/api/categories/suggestions?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    throw error;
  }
};
