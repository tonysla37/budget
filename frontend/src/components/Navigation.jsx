import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          Budget App
        </Link>

        <button className="burger-menu" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <ul className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`}>
          <li>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Tableau de bord
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Transactions
            </Link>
          </li>
          <li>
            <Link 
              to="/add-transaction" 
              className={`nav-link ${isActive('/add-transaction') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Ajouter
            </Link>
          </li>
          <li>
            <Link 
              to="/categories" 
              className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Catégories
            </Link>
          </li>
          <li>
            <Link 
              to="/budgets" 
              className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Budgets
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Statistiques
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Paramètres
            </Link>
          </li>
        </ul>

        <div className="nav-user">
          <span className="user-name">
            <User size={16} />
            <span className="user-email">{user?.email}</span>
          </span>
          <button onClick={handleLogout} className="btn btn-secondary btn-logout">
            <LogOut size={16} />
            <span className="logout-text">Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
