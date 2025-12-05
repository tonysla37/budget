import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings } from '../services/settingsService';
import { exportUserData, importUserData, purgeUserData, previewImportData } from '../services/dataService';
import { Save, Calendar, User, Mail, LogOut, Lock, Download, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsScreen() {
  const { t } = useTranslation();
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
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [confirmImport, setConfirmImport] = useState({ isOpen: false, data: null, stats: null });

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
    setConfirmLogout(true);
  };

  const confirmLogoutAction = () => {
    logout();
    navigate('/login');
  };

  const handlePurge = () => {
    setConfirmPurge(true);
  };

  const confirmPurgeAction = async () => {
    try {
      const result = await purgeUserData();
      setMessage({ 
        type: 'success', 
        text: `✅ ${result.total_deleted} éléments supprimés avec succès !` 
      });
      setConfirmPurge(false);
    } catch (error) {
      console.error('Erreur lors de la purge:', error);
      setMessage({ type: 'error', text: '❌ Erreur lors de la purge des données' });
      setConfirmPurge(false);
    }
  };

  // Export des données
  const handleExport = async () => {
    try {
      const data = await exportUserData();
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: '✅ Export réussi ! Le fichier a été téléchargé.' });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setMessage({ type: 'error', text: '❌ Erreur lors de l\'export des données' });
    }
  };

  // Import des données
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Appeler l'endpoint de prévisualisation
      setMessage({ type: 'info', text: '⏳ Analyse du fichier en cours...' });
      const preview = await previewImportData(data);
      
      setConfirmImport({ isOpen: true, data, preview });
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setMessage({ type: 'error', text: '❌ Fichier invalide ou erreur lors de l\'analyse' });
    }
  };

  const confirmImportAction = async () => {
    try {
      const result = await importUserData(confirmImport.data);
      
      setMessage({ 
        type: 'success', 
        text: `✅ Import réussi !\n${result.imported.categories} catégories, ${result.imported.transactions} transactions, ${result.imported.rules} règles importées.` 
      });
      
      setConfirmImport({ isOpen: false, data: null, preview: null });
      
      // Recharger la page après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setMessage({ type: 'error', text: '❌ Erreur lors de l\'import : fichier invalide ou erreur serveur' });
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

        {/* Export / Import des données */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Sauvegarde & Restauration</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Exportez vos données ou importez une sauvegarde
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">📥 Exporter mes données</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Téléchargez un fichier JSON contenant toutes vos données (catégories, transactions, règles, comptes).
                  </p>
                  <button
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </button>
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">📤 Importer des données</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Restaurez une sauvegarde précédente. Les données seront ajoutées à votre compte actuel.
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer inline-flex"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissement */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Important :</strong>
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                <li>L'export crée une copie de vos données sans informations personnelles</li>
                <li>L'import ajoute les données (ne remplace pas)</li>
                <li>Gardez vos exports en lieu sûr (sauvegarde régulière recommandée)</li>
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
            onClick={() => navigate('/change-password')}
            className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            <Lock className="h-5 w-5 mr-2" />
            Changer le mot de passe
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t('settings.logout')}
          </button>

          <button
            onClick={handlePurge}
            className="flex items-center justify-center px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 font-medium"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Purger
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={confirmLogoutAction}
        title={t('settings.logoutConfirm')}
        message="Vous allez être déconnecté de votre session."
        confirmText="Se déconnecter"
        cancelText="Annuler"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={confirmPurge}
        onClose={() => setConfirmPurge(false)}
        onConfirm={confirmPurgeAction}
        title="Purger toutes les données ?"
        message="⚠️ ATTENTION : Cette action supprimera définitivement TOUTES vos données (catégories, transactions, règles, budgets, comptes). Cette action est IRRÉVERSIBLE !"
        confirmText="Oui, tout supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmImport.isOpen}
        onClose={() => setConfirmImport({ isOpen: false, data: null, preview: null })}
        onConfirm={confirmImportAction}
        title="Confirmer l'import"
        message={confirmImport.preview ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">Fichier exporté le: <strong>{new Date(confirmImport.preview.file_info.export_date).toLocaleString('fr-FR')}</strong></p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Aperçu des modifications</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Catégories:</span>
                  <span className="font-medium">
                    {confirmImport.preview.import_summary.categories.current} → {confirmImport.preview.import_summary.categories.after_import}
                    <span className="text-green-600 ml-2">(+{confirmImport.preview.import_summary.categories.new})</span>
                    {confirmImport.preview.import_summary.categories.duplicates > 0 && (
                      <span className="text-orange-600 ml-2">({confirmImport.preview.import_summary.categories.duplicates} ignorés)</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Transactions:</span>
                  <span className="font-medium">
                    {confirmImport.preview.import_summary.transactions.current} → {confirmImport.preview.import_summary.transactions.after_import}
                    <span className="text-green-600 ml-2">(+{confirmImport.preview.import_summary.transactions.new})</span>
                    {confirmImport.preview.import_summary.transactions.duplicates > 0 && (
                      <span className="text-orange-600 ml-2">({confirmImport.preview.import_summary.transactions.duplicates} ignorés)</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Règles:</span>
                  <span className="font-medium">
                    {confirmImport.preview.import_summary.rules.current} → {confirmImport.preview.import_summary.rules.after_import}
                    <span className="text-green-600 ml-2">(+{confirmImport.preview.import_summary.rules.new})</span>
                    {confirmImport.preview.import_summary.rules.duplicates > 0 && (
                      <span className="text-orange-600 ml-2">({confirmImport.preview.import_summary.rules.duplicates} ignorés)</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Budgets:</span>
                  <span className="font-medium">
                    {confirmImport.preview.import_summary.budgets.current} → {confirmImport.preview.import_summary.budgets.after_import}
                    <span className="text-green-600 ml-2">(+{confirmImport.preview.import_summary.budgets.new})</span>
                    {confirmImport.preview.import_summary.budgets.duplicates > 0 && (
                      <span className="text-orange-600 ml-2">({confirmImport.preview.import_summary.budgets.duplicates} ignorés)</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Connexions bancaires:</span>
                  <span className="font-medium">
                    {confirmImport.preview.import_summary.bank_connections.current} → {confirmImport.preview.import_summary.bank_connections.after_import}
                    <span className="text-green-600 ml-2">(+{confirmImport.preview.import_summary.bank_connections.new})</span>
                    {confirmImport.preview.import_summary.bank_connections.duplicates > 0 && (
                      <span className="text-orange-600 ml-2">({confirmImport.preview.import_summary.bank_connections.duplicates} ignorés)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {confirmImport.preview.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Avertissements</h4>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {confirmImport.preview.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-4">
              Voulez-vous continuer avec cet import ?
            </p>
          </div>
        ) : ''}
        confirmText="Importer"
        cancelText="Annuler"
        variant="warning"
      />
    </div>
  );
}
