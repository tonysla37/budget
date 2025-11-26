import { apiCall } from '../config/api.config';

export const getSettings = async () => {
  try {
    return await apiCall('/api/settings/', { method: 'GET' });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    throw error;
  }
};

export const updateSettings = async (settings) => {
  try {
    return await apiCall('/api/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
};
