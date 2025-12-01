import { apiCall } from '../config/api.config';

export const getBankConnections = async () => {
  try {
    return await apiCall('/api/bank-connections/', {
      method: 'GET'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des connexions:', error);
    throw error;
  }
};

export const createBankConnection = async (connectionData) => {
  try {
    return await apiCall('/api/bank-connections/', {
      method: 'POST',
      body: JSON.stringify(connectionData)
    });
  } catch (error) {
    console.error('Erreur lors de la création de la connexion:', error);
    throw error;
  }
};

export const deleteBankConnection = async (id) => {
  try {
    return await apiCall(`/api/bank-connections/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la connexion:', error);
    throw error;
  }
};

export const syncBankConnection = async (id) => {
  try {
    return await apiCall(`/api/bank-connections/${id}/sync`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    throw error;
  }
};

export const testBankConnection = async (id) => {
  try {
    return await apiCall(`/api/bank-connections/${id}/test`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    throw error;
  }
};

export const getBankAccounts = async (connectionId) => {
  try {
    return await apiCall(`/api/bank-connections/${connectionId}/accounts`, {
      method: 'GET'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    throw error;
  }
};
