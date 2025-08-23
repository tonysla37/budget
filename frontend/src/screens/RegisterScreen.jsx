import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { registerUser } from '../services/authService';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Veuillez remplir votre prénom et nom');
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        login(result.user);
        navigate('/');
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <button 
            className="back-button"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1>Créer un compte</h1>
          <p>Rejoignez Budget App</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Prénom
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="form-input"
              placeholder="Votre prénom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Nom
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="form-input"
              placeholder="Votre nom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Mot de passe
            </label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Confirmer le mot de passe
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirmez votre mot de passe"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </form>

        <div className="login-footer">
          <p>Déjà un compte ?</p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
