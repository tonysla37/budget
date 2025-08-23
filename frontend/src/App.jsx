import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import Navigation from './components/Navigation';
import './App.css';

// Composant pour les routes protégées
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// Composant principal de l'application
const AppContent = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="app">
      {isLoggedIn && <Navigation />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <TransactionsScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-transaction" 
            element={
              <ProtectedRoute>
                <AddTransactionScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                <CategoriesScreen />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

// Composant racine avec providers
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
