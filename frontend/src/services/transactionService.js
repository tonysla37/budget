import { apiCall } from '../config/api.config';

// Récupérer toutes les transactions
export const getTransactions = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const endpoint = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiCall(endpoint);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    throw error;
  }
};

// Récupérer une transaction par ID
export const getTransaction = async (id) => {
  try {
    return await apiCall(`/api/transactions/${id}`);
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    throw error;
  }
};

// Créer une nouvelle transaction
export const createTransaction = async (transactionData) => {
  try {
    return await apiCall('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    throw error;
  }
};

// Mettre à jour une transaction
export const updateTransaction = async (id, transactionData) => {
  try {
    return await apiCall(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la transaction:', error);
    throw error;
  }
};

// Supprimer une transaction
export const deleteTransaction = async (id) => {
  try {
    await apiCall(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la transaction:', error);
    throw error;
  }
};

// Récupérer les statistiques des transactions
export const getTransactionStats = async (period = 'current') => {
  try {
    return await apiCall(`/api/transactions/stats?period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

// Récupérer les transactions par catégorie
export const getTransactionsByCategory = async (categoryId, period = 'current') => {
  try {
    return await apiCall(`/api/transactions/by-category/${categoryId}?period=${period}`);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions par catégorie:', error);
    throw error;
  }
};

// Purger TOUTES les transactions de l'utilisateur
export const purgeAllTransactions = async () => {
  try {
    return await apiCall('/api/transactions/purge', {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Erreur lors de la purge des transactions:', error);
    throw error;
  }
};
