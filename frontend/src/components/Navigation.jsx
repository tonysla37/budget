import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { LogOut, User, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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
          {t('nav.brand')}
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
              {t('nav.dashboard')}
            </Link>
          </li>
          <li>
            <Link 
              to="/transactions" 
              className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.transactions')}
            </Link>
          </li>
          <li>
            <Link 
              to="/add-transaction" 
              className={`nav-link ${isActive('/add-transaction') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.addTransaction')}
            </Link>
          </li>
          <li>
            <Link 
              to="/categories" 
              className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.categories')}
            </Link>
          </li>
          <li>
            <Link 
              to="/budgets" 
              className={`nav-link ${isActive('/budgets') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.budgets')}
            </Link>
          </li>
          <li>
            <Link 
              to="/rules" 
              className={`nav-link ${isActive('/rules') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Règles
            </Link>
          </li>
          <li>
            <Link 
              to="/reports" 
              className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.reports')}
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {t('nav.settings')}
            </Link>
          </li>
        </ul>

        <div className="nav-user">
          <LanguageSwitcher />
          <span className="user-name">
            <User size={16} />
            <span className="user-email">{user?.email}</span>
          </span>
          <button onClick={handleLogout} className="btn btn-secondary btn-logout">
            <LogOut size={16} />
            <span className="logout-text">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
