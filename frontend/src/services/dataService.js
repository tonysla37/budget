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

// Prévisualiser l'import de données
export const previewImportData = async (data) => {
  try {
    return await apiCall('/api/users/me/import/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Erreur lors de la prévisualisation:', error);
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

// Purger toutes les données de l'utilisateur
export const purgeUserData = async () => {
  try {
    return await apiCall('/api/users/me/purge', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Erreur lors de la purge:', error);
    throw error;
  }
};
