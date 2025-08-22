// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000, // 10 secondes
  RETRY_ATTEMPTS: 3,
};

// Headers par défaut
export const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// Gestion des erreurs API
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Fonction utilitaire pour les appels API
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    headers: {
      ...getDefaultHeaders(),
      ...options.headers,
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };

  // Ajouter le token d'authentification si disponible
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      let errorData = null;
      
      try {
        const errorResponse = await response.json();
        errorMessage = errorResponse.detail || errorResponse.message || errorMessage;
        errorData = errorResponse;
      } catch (e) {
        // Si on ne peut pas parser la réponse d'erreur
      }
      
      throw new ApiError(errorMessage, response.status, errorData);
    }
    
    // Pour les réponses vides (DELETE, etc.)
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erreurs de réseau
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Erreur de connexion au serveur', 0);
    }
    
    throw new ApiError('Erreur inattendue', 0);
  }
};

// Stockage local pour l'authentification (utilise localStorage au lieu d'AsyncStorage)
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export const setAuthToken = (token) => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Erreur lors du stockage du token:', error);
  }
};

export const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

export const removeAuthToken = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error);
  }
};

export const setUserData = (userData) => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Erreur lors du stockage des données utilisateur:', error);
  }
};

export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
}; 