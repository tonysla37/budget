import { apiCall, setAuthToken, removeAuthToken, setUserData, getUserData } from '../config/api.config';

// Connexion utilisateur
export const loginUser = async (email, password) => {
  try {
    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.access_token) {
      await setAuthToken(response.access_token);
      await setUserData(response.user);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return false;
  }
};

// Déconnexion utilisateur
export const logoutUser = async () => {
  try {
    // Appel au backend pour invalider le token
    await apiCall('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    // Suppression locale du token
    await removeAuthToken();
  }
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

// Récupérer les données utilisateur
export const getCurrentUser = async () => {
  return await getUserData();
};

// Rafraîchir le token
export const refreshToken = async () => {
  try {
    const response = await apiCall('/api/auth/refresh', {
      method: 'POST',
    });

    if (response.access_token) {
      await setAuthToken(response.access_token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    await removeAuthToken();
    return false;
  }
};

// Inscription utilisateur
export const registerUser = async (userData) => {
  try {
    const response = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.access_token) {
      await setAuthToken(response.access_token);
      await setUserData(response.user);
      return { success: true, user: response.user };
    }
    
    return { success: false, message: 'Erreur lors de l\'inscription' };
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    return { success: false, message: error.message };
  }
};
