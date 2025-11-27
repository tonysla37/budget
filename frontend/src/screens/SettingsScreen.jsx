import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings } from '../services/settingsService';
import { Save, Calendar, User, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    billing_cycle_day: 1
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getSettings();
      setProfile({
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        billing_cycle_day: data.billing_cycle_day || 1
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setMessage({ type: 'error', text: t('settings.errorLoading') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateSettings({
        first_name: profile.first_name,
        last_name: profile.last_name,
        billing_cycle_day: profile.billing_cycle_day
      });
      setMessage({ type: 'success', text: t('settings.successMessage') });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setMessage({ type: 'error', text: t('settings.errorMessage') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('settings.logoutConfirm'))) {
      logout();
      navigate('/login');
    }
  };

  // Calculer la période de référence actuelle
  const getCurrentPeriod = () => {
    const today = new Date();
    const day = profile.billing_cycle_day;
    
    let startDate, endDate;
    
    if (today.getDate() >= day) {
      // On est dans la période actuelle
      startDate = new Date(today.getFullYear(), today.getMonth(), day);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, day - 1);
    } else {
      // On est avant le début du cycle, donc période précédente
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, day);
      endDate = new Date(today.getFullYear(), today.getMonth(), day - 1);
    }
    
    return { startDate, endDate };
  };

  const formatPeriodDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const { startDate, endDate } = getCurrentPeriod();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message de confirmation/erreur */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Informations du profil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.profileTitle')}</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                {t('settings.emailLabel')}
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">{t('settings.emailNote')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.firstNameLabel')}
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settings.firstNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.lastNameLabel')}
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settings.lastNamePlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Période de référence */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">{t('settings.billingTitle')}</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.billingSubtitle')}
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.billingDayLabel')}
              </label>
              <select
                value={profile.billing_cycle_day}
                onChange={(e) => setProfile({ ...profile, billing_cycle_day: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    Le {day} de chaque mois
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.billingNote')}
              </p>
            </div>

            {/* Aperçu de la période actuelle */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                📅 Votre période actuelle :
              </p>
              <p className="text-blue-800">
                Du <span className="font-semibold">{formatPeriodDate(startDate)}</span> au{' '}
                <span className="font-semibold">{formatPeriodDate(endDate)}</span>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>{t('settings.howItWorks')}</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>{t('settings.howItWorksItems.0')}</li>
                <li>{t('settings.howItWorksItems.1')}</li>
                <li>{t('settings.howItWorksItems.2')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? t('settings.saving') : t('settings.save')}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
