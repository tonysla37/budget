import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, registerUser, getCurrentUser, isAuthenticated } from '../services/authService';
import { getUserData, getAuthToken } from '../config/api.config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // D'abord vérifier si on a un token dans localStorage
        const token = getAuthToken();
        if (token) {
          // Essayer de récupérer les données utilisateur depuis localStorage
          const cachedUser = getUserData();
          if (cachedUser) {
            setUser(cachedUser);
          }
          
          // Vérifier que le token est toujours valide avec le backend
          const authenticated = await isAuthenticated();
          if (authenticated) {
            const userData = await getCurrentUser();
            setUser(userData);
          } else {
            // Token invalide, nettoyer
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await loginUser(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await registerUser(userData);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
