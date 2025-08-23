import { apiCall, setAuthToken, removeAuthToken, setUserData, getUserData, getAuthToken } from '../config/api.config';

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
      // Récupérer les données utilisateur après connexion
      try {
        const userData = await apiCall('/api/auth/me');
        await setUserData(userData);
        return { success: true, user: userData };
      } catch (userError) {
        console.warn('Impossible de récupérer les données utilisateur:', userError);
        // Créer un objet utilisateur basique avec l'email
        const basicUser = { email: email };
        await setUserData(basicUser);
        return { success: true, user: basicUser };
      }
    }
    
    return { success: false, message: 'Token d\'accès manquant dans la réponse' };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return { success: false, message: error.message || 'Erreur de connexion' };
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
  const token = getAuthToken();
  return !!token;
};

// Récupérer les données utilisateur
export const getCurrentUser = async () => {
  try {
    return await apiCall('/api/auth/me');
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return await getUserData();
  }
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
      // Récupérer les données utilisateur après inscription
      try {
        const userData = await apiCall('/api/auth/me');
        await setUserData(userData);
        return { success: true, user: userData };
      } catch (userError) {
        console.warn('Impossible de récupérer les données utilisateur:', userError);
        // Créer un objet utilisateur basique
        const basicUser = { 
          email: userData.email, 
          first_name: userData.first_name, 
          last_name: userData.last_name 
        };
        await setUserData(basicUser);
        return { success: true, user: basicUser };
      }
    }
    
    return { success: false, message: 'Erreur lors de l\'inscription' };
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'inscription' };
  }
};
