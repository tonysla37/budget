import { apiCall } from '../config/api.config';

/**
 * Service pour la gestion du profil utilisateur
 */

/**
 * Récupère les informations de l'utilisateur connecté
 */
export const getCurrentUser = async () => {
  try {
    const data = await apiCall('/api/users/me', {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
};

/**
 * Met à jour les informations de l'utilisateur connecté
 */
export const updateUserProfile = async (userData) => {
  try {
    const data = await apiCall('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};

/**
 * Change le mot de passe de l'utilisateur connecté
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const data = await apiCall('/api/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return data;
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    throw error;
  }
};
