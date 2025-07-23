import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration d'axios
const API = axios.create({
  baseURL: 'http://localhost:8000/api', // À remplacer par l'URL de votre serveur en production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      // Rediriger vers la page de connexion si nécessaire
      // Vous pouvez utiliser un état global ou un contexte React pour gérer la redirection
    }
    return Promise.reject(error);
  }
);

// Services d'API
export const authService = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // L'API OAuth2 utilise username même pour un email
    formData.append('password', password);
    
    const response = await axios.post(
      `${API.defaults.baseURL}/auth/token`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    if (response.data.access_token) {
      await AsyncStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },
  
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },
  
  linkBoursoramaAccount: async (credentials) => {
    const response = await API.post('/auth/boursorama', credentials);
    return response.data;
  },
};

export const userService = {
  getCurrentUser: async () => {
    const response = await API.get('/users/me');
    return response.data;
  },
  
  updateUser: async (userData) => {
    const response = await API.put('/users/me', userData);
    return response.data;
  },
};

export const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await API.get('/transactions', { params });
    return response.data;
  },
  
  getTransaction: async (id) => {
    const response = await API.get(`/transactions/${id}`);
    return response.data;
  },
  
  createTransaction: async (transaction) => {
    const response = await API.post('/transactions', transaction);
    return response.data;
  },
  
  updateTransaction: async (id, transaction) => {
    const response = await API.put(`/transactions/${id}`, transaction);
    return response.data;
  },
  
  deleteTransaction: async (id) => {
    await API.delete(`/transactions/${id}`);
    return true;
  },
  
  syncTransactions: async () => {
    const response = await API.post('/transactions/sync');
    return response.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const response = await API.get('/categories/categories');
    return response.data;
  },
  
  getTags: async () => {
    const response = await API.get('/categories/tags');
    return response.data;
  },
  
  createCategory: async (category) => {
    const response = await API.post('/categories/categories', category);
    return response.data;
  },
  
  createTag: async (tag) => {
    const response = await API.post('/categories/tags', tag);
    return response.data;
  },
};

export const reportService = {
  getMonthlyReport: async (year, month) => {
    const response = await API.get(`/reports/monthly/${year}/${month}`);
    return response.data;
  },
  
  getSalaryBasedReport: async (referenceDate) => {
    const params = {};
    if (referenceDate) {
      params.reference_date = referenceDate.toISOString().split('T')[0];
    }
    
    const response = await API.get('/reports/salary-based', { params });
    return response.data;
  },
  
  getTrends: async (params = {}) => {
    const response = await API.get('/reports/trends', { params });
    return response.data;
  },
};

export default {
  auth: authService,
  user: userService,
  transaction: transactionService,
  category: categoryService,
  report: reportService,
}; 