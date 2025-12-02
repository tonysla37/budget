import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBankConnections, createBankConnection, deleteBankConnection, syncBankConnection, getBankAccounts } from '../services/bankService';
import { purgeAllTransactions, bulkImportTransactions } from '../services/transactionService';
import { parseCSVFile } from '../services/csvParser';
import { Plus, Trash2, RefreshCw, Lock, Eye, EyeOff, Building2, CheckCircle, AlertCircle, Wallet, CreditCard, PiggyBank, TrendingUp, Upload, FileText, AlertTriangle } from 'lucide-react';

export default function BankConnectionsScreen() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [accounts, setAccounts] = useState({});  // Stockage des comptes par connection_id
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  
  const [formData, setFormData] = useState({
    bank: 'boursobank',
    connection_type: 'mock', // mock, scraping, api
    username: '',
    password: '',
    api_client_id: '',
    api_client_secret: '',
    nickname: ''
  });

  const banks = [
    { id: 'boursobank', name: 'BoursoBank', icon: '🏦' },
    { id: 'cic', name: 'CIC', icon: '🏛️' }
  ];

  const connectionTypes = [
    { 
      id: 'mock', 
      name: 'Mode Démo', 
      description: 'Données de test (recommandé)',
      secure: true
    },
    { 
      id: 'scraping', 
      name: 'Scraping Web', 
      description: 'Non recommandé en production',
      secure: false
    },
    { 
      id: 'api', 
      name: 'API Officielle', 
      description: 'Budget Insight / Bridge',
      secure: true
    }
  ];

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await getBankConnections();
      setConnections(data || []);
      
      // Charger les comptes pour chaque connexion
      for (const connection of data || []) {
        if (connection.accounts_count > 0) {
          loadAccounts(connection.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccounts = async (connectionId) => {
    try {
      const accountsData = await getBankAccounts(connectionId);
      setAccounts(prev => ({
        ...prev,
        [connectionId]: accountsData || []
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const payload = {
        bank: formData.bank,
        connection_type: formData.connection_type,
        nickname: formData.nickname || getBankName(formData.bank),
      };

      // Ajouter les credentials selon le type
      if (formData.connection_type === 'api') {
        payload.api_client_id = formData.api_client_id;
        payload.api_client_secret = formData.api_client_secret;
      } else {
        payload.username = formData.username;
        payload.password = formData.password;
      }

      await createBankConnection(payload);
      
      setShowModal(false);
      resetForm();
      loadConnections();
      
      setMessage({ type: 'success', text: 'Connexion bancaire ajoutée avec succès' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de la création de la connexion:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la création de la connexion: ' + (error.message || 'Erreur inconnue') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (connectionId) => {
    try {
      setSyncingId(connectionId);
      const result = await syncBankConnection(connectionId);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Synchronisation réussie: ${result.new_transactions} nouvelle(s) transaction(s), ${result.updated_accounts} compte(s) mis à jour` 
        });
        setTimeout(() => setMessage(null), 5000);
        loadConnections();
        loadAccounts(connectionId);  // Recharger les comptes après sync
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la synchronisation' });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la synchronisation' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBankConnection(id);
      setMessage({ type: 'success', text: 'Connexion bancaire supprimée avec succès' });
      setTimeout(() => setMessage(null), 5000);
      setDeleteConfirmId(null);
      loadConnections();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
      setDeleteConfirmId(null);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier CSV' });
      return;
    }

    setImportFile(file);
    
    try {
      // Parser le CSV côté frontend
      const result = await parseCSVFile(file);
      setImportPreview(result);
      
      // Auto-sélectionner la connexion bancaire si elle correspond
      if (result.detected_bank && connections.length > 0) {
        const bankName = result.detected_bank.toLowerCase();
        const matchingConnection = connections.find(conn => {
          const connName = (conn.nickname || conn.bank_name || '').toLowerCase();
          // Rechercher boursobank, bourso, cic selon la banque détectée
          if (bankName === 'boursobank') {
            return connName.includes('bourso');
          } else if (bankName === 'cic') {
            return connName.includes('cic');
          }
          return connName.includes(bankName);
        });
        
        if (matchingConnection) {
          setSelectedConnection(matchingConnection.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la prévisualisation du fichier: ' + error.message });
      setImportFile(null);
    }
  };

  const handleImport = async () => {
    if (!importPreview || !importPreview.transactions) return;

    setIsImporting(true);
    try {
      // Envoyer les transactions au backend
      const result = await bulkImportTransactions(
        importPreview.transactions,
        {
          bankConnectionId: selectedConnection,
          bankAccountId: selectedAccount,
          categoryId: null
        }
      );

      setMessage({ 
        type: 'success', 
        text: `Import réussi ! ${result.imported} transactions importées, ${result.skipped} doublons ignorés` 
      });
      setTimeout(() => setMessage(null), 5000);
      
      // Rafraîchir les données
      if (selectedConnection) {
        await loadAccounts(selectedConnection);
      }
      
      // Fermer le modal
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      setSelectedConnection(null);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'import: ' + error.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePurgeTransactions = async () => {
    setIsPurging(true);
    try {
      const result = await purgeAllTransactions();
      setMessage({ 
        type: 'success', 
        text: `Purge effectuée avec succès ! ${result.deleted_count} transaction(s) supprimée(s)` 
      });
      setTimeout(() => setMessage(null), 5000);
      
      // Fermer le modal
      setShowPurgeModal(false);
      
      // Rafraîchir les comptes pour mettre à jour les soldes
      for (const conn of connections) {
        await loadAccounts(conn.id);
      }
    } catch (error) {
      console.error('Erreur lors de la purge:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la purge: ' + error.message });
    } finally {
      setIsPurging(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bank: 'boursobank',
      connection_type: 'mock',
      username: '',
      password: '',
      api_client_id: '',
      api_client_secret: '',
      nickname: ''
    });
    setShowPassword(false);
    setShowApiSecret(false);
  };

  const getBankName = (bankId) => {
    return banks.find(b => b.id === bankId)?.name || bankId;
  };

  const getConnectionTypeInfo = (type) => {
    return connectionTypes.find(t => t.id === type);
  };

  const getAccountIcon = (accountType) => {
    switch (accountType) {
      case 'checking':
        return <Wallet className="h-4 w-4" />;
      case 'savings':
        return <PiggyBank className="h-4 w-4" />;
      case 'securities':
        return <TrendingUp className="h-4 w-4" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const formatAccountType = (type) => {
    const types = {
      'checking': 'Compte courant',
      'savings': 'Compte épargne',
      'securities': 'Compte titres',
      'credit_card': 'Carte de crédit',
      'loan': 'Prêt'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connexions Bancaires</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos connexions aux banques et synchronisez vos transactions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurgeModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Purger tout
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Upload className="h-5 w-5 mr-2" />
                Importer CSV
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une connexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message d'alerte */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="ml-3 flex-shrink-0"
              >
                <Plus className="h-5 w-5 rotate-45 opacity-50 hover:opacity-100" />
              </button>
            </div>
          </div>
        )}

        {isLoading && connections.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune connexion bancaire</h3>
            <p className="text-gray-500 mb-6">
              Ajoutez une connexion pour synchroniser automatiquement vos transactions
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter votre première banque
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => {
              const bank = banks.find(b => b.id === connection.bank);
              const typeInfo = getConnectionTypeInfo(connection.connection_type);
              
              return (
                <div key={connection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      <div className="text-3xl mr-3">{bank?.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {connection.nickname || bank?.name}
                          </h3>
                          {/* Tag de la banque */}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            connection.bank === 'boursobank' 
                              ? 'bg-pink-100 text-pink-700' 
                              : connection.bank === 'cic'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {connection.bank.toUpperCase()}
                          </span>
                          {/* Tag du type de connexion */}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            connection.connection_type === 'mock'
                              ? 'bg-purple-100 text-purple-700'
                              : connection.connection_type === 'api'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {connection.connection_type === 'mock' ? '🎮 DÉMO' : typeInfo?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{bank?.name}</p>
                      </div>
                    </div>
                    {connection.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm">
                      <Lock className={`h-4 w-4 mr-2 ${typeInfo?.secure ? 'text-green-600' : 'text-orange-600'}`} />
                      <span className="text-gray-600">
                        {typeInfo?.secure ? 'Connexion sécurisée' : 'Connexion non chiffrée'}
                      </span>
                    </div>
                    
                    {connection.accounts_count > 0 && (
                      <div className="text-sm text-gray-600">
                        {connection.accounts_count} compte(s) synchronisé(s)
                      </div>
                    )}
                    
                    {connection.last_sync && (
                      <div className="text-xs text-gray-500">
                        Dernière sync: {new Date(connection.last_sync).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Liste des comptes synchronisés */}
                  {accounts[connection.id] && accounts[connection.id].length > 0 && (
                    <div className="mb-4 space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Comptes synchronisés
                      </div>
                      {accounts[connection.id].map((account) => (
                        <div 
                          key={account.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="text-gray-600">
                              {getAccountIcon(account.account_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {account.name}
                              </div>
                              {account.external_id && (
                                <div className="text-xs text-gray-500 truncate">
                                  {account.external_id}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat('fr-FR', { 
                                style: 'currency', 
                                currency: account.currency || 'EUR' 
                              }).format(account.balance)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatAccountType(account.account_type)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(connection.id)}
                      disabled={syncingId === connection.id}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncingId === connection.id ? 'animate-spin' : ''}`} />
                      Synchroniser
                    </button>
                    
                    {deleteConfirmId === connection.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          title="Confirmer la suppression"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          title="Annuler"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(connection.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        title="Supprimer la connexion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ajouter une connexion bancaire</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banque
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {banks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, bank: bank.id })}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                        formData.bank === bank.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl mr-3">{bank.icon}</span>
                      <span className="font-medium">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type de connexion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de connexion
                </label>
                <div className="space-y-2">
                  {connectionTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, connection_type: type.id })}
                      className={`w-full flex items-start p-4 border-2 rounded-lg transition-all text-left ${
                        formData.connection_type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Lock className={`h-5 w-5 mr-3 mt-0.5 ${type.secure ? 'text-green-600' : 'text-orange-600'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surnom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surnom (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Ex: Compte principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Credentials selon le type (pas nécessaire en mode démo) */}
              {formData.connection_type !== 'mock' && formData.connection_type === 'api' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={formData.api_client_id}
                      onChange={(e) => setFormData({ ...formData, api_client_id: e.target.value })}
                      placeholder="Votre Client ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showApiSecret ? 'text' : 'password'}
                        value={formData.api_client_secret}
                        onChange={(e) => setFormData({ ...formData, api_client_secret: e.target.value })}
                        placeholder="Votre Client Secret"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : formData.connection_type !== 'mock' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Identifiant
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder={formData.bank === 'cic' ? '10 chiffres' : 'Email ou identifiant'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={formData.bank === 'cic' ? '6 chiffres' : 'Mot de passe'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    ℹ️ Mode démo : aucun identifiant requis. Des données de test seront générées automatiquement.
                  </p>
                </div>
              )}

              {/* Avertissement sécurité */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Sécurité:</strong> Vos identifiants sont chiffrés avec AES-256 avant d'être stockés. 
                    Seul vous pouvez y accéder via votre compte.
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter la connexion
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Importer des transactions (CSV)</h2>
              <p className="text-gray-600 mt-1">Importez vos transactions depuis un fichier CSV BoursoBank ou CIC</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sélection du fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier CSV
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  {importFile && (
                    <FileText className="h-5 w-5 text-green-600" />
                  )}
                </div>
                {importFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Fichier: <span className="font-medium">{importFile.name}</span>
                  </p>
                )}
              </div>

              {/* Sélection de la connexion (optionnel) */}
              {connections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connexion bancaire (optionnel)
                  </label>
                  <select
                    value={selectedConnection || ''}
                    onChange={(e) => {
                      setSelectedConnection(e.target.value || null);
                      setSelectedAccount(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune connexion (transactions manuelles)</option>
                    {connections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {getBankName(conn.bank)} - {conn.nickname || conn.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sélection du compte si connexion sélectionnée */}
              {selectedConnection && accounts[selectedConnection] && accounts[selectedConnection].length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compte bancaire (optionnel)
                  </label>
                  <select
                    value={selectedAccount || ''}
                    onChange={(e) => setSelectedAccount(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les comptes</option>
                    {accounts[selectedConnection].map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.external_id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prévisualisation */}
              {importPreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Prévisualisation</h3>
                  <div className="space-y-2 text-sm">
                    {importPreview.detected_bank && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Banque détectée:</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          importPreview.detected_bank === 'boursobank' 
                            ? 'bg-pink-100 text-pink-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {importPreview.detected_bank === 'boursobank' ? '🏦 BoursoBank' : '🏛️ CIC'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format détecté:</span>
                      <span className="font-medium">CSV</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transactions détectées:</span>
                      <span className="font-medium">{importPreview.total_transactions || 0}</span>
                    </div>
                  </div>

                  {importPreview.preview && importPreview.preview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Aperçu (premières transactions):</p>
                      <div className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-2 py-1 text-left text-gray-600 font-medium">Date</th>
                                <th className="px-2 py-1 text-left text-gray-600 font-medium">Description</th>
                                <th className="px-2 py-1 text-left text-gray-600 font-medium">Montant</th>
                                <th className="px-2 py-1 text-left text-gray-600 font-medium">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {importPreview.preview.map((trans, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-2 py-1 text-gray-900">{trans.date}</td>
                                  <td className="px-2 py-1 text-gray-900 truncate max-w-xs">{trans.description}</td>
                                  <td className="px-2 py-1 text-gray-900">{trans.amount.toFixed(2)}€</td>
                                  <td className="px-2 py-1">
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      trans.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {trans.type === 'income' ? 'Crédit' : 'Débit'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer {importPreview ? `${importPreview.total_rows} transactions` : ''}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview(null);
                    setSelectedConnection(null);
                    setSelectedAccount(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de purge */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Purger toutes les transactions ?</h2>
                  <p className="text-sm text-gray-500 mt-1">Cette action est irréversible</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Attention :</strong> Cette action va supprimer <strong>TOUTES</strong> vos transactions (manuelles et bancaires).
                  Vous ne pourrez pas récupérer ces données.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePurgeTransactions}
                  disabled={isPurging}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPurging ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Oui, tout supprimer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  disabled={isPurging}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
