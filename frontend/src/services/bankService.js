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

export const previewCSVImport = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/import/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Session expirée');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la prévisualisation');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la prévisualisation du CSV:', error);
    throw error;
  }
};

export const importCSV = async (file, bankConnectionId = null, bankAccountId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (bankConnectionId) formData.append('bank_connection_id', bankConnectionId);
    if (bankAccountId) formData.append('bank_account_id', bankAccountId);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/import/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Session expirée');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de l\'import');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'import du CSV:', error);
    throw error;
  }
};
