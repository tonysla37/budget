import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link to="/" className="nav-brand">
          Budget App
        </Link>
        
        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Tableau de bord
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
            >
              Transactions
            </Link>
          </li>
          <li>
            <Link 
              to="/add-transaction" 
              className={`nav-link ${isActive('/add-transaction') ? 'active' : ''}`}
            >
              Ajouter
            </Link>
          </li>
          <li>
            <Link 
              to="/categories" 
              className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
            >
              Catégories
            </Link>
          </li>
          <li>
            <Link 
              to="/budgets" 
              className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
            >
              Budgets
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
            >
              Paramètres
            </Link>
          </li>
        </ul>

        <div className="nav-user">
          <span className="user-name">
            <User size={16} />
            {user?.email}
          </span>
          <button onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
