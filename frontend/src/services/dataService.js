import { apiCall } from '../config/api.config';

// Exporter toutes les données de l'utilisateur
export const exportUserData = async () => {
  try {
    return await apiCall('/api/users/me/export');
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
};

// Importer des données pour l'utilisateur
export const importUserData = async (data) => {
  try {
    return await apiCall('/api/users/me/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    throw error;
  }
};
