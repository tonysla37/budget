import React, { useState, useEffect } from 'react';
import { getBankConnections, createBankConnection, deleteBankConnection, syncBankConnection } from '../services/bankService';
import { Plus, Trash2, RefreshCw, Lock, Eye, EyeOff, Building2, CheckCircle, AlertCircle } from 'lucide-react';

export default function BankConnectionsScreen() {
  const [connections, setConnections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  
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
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error);
    } finally {
      setIsLoading(false);
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
      
      alert('Connexion bancaire ajoutée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de la connexion:', error);
      alert('Erreur lors de la création de la connexion: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (connectionId) => {
    try {
      setSyncingId(connectionId);
      const result = await syncBankConnection(connectionId);
      
      if (result.success) {
        alert(`Synchronisation réussie: ${result.new_transactions} nouvelles transactions`);
        loadConnections();
      } else {
        alert('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette connexion bancaire ?')) {
      try {
        await deleteBankConnection(id);
        loadConnections();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
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
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter une banque
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(connection.id)}
                      disabled={syncingId === connection.id}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncingId === connection.id ? 'animate-spin' : ''}`} />
                      Synchroniser
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
    </div>
  );
}
