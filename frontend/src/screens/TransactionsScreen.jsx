import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTransactions, deleteTransaction } from '../services/transactionService';
import { getCategories } from '../services/categoryService';
import { getUserProfile } from '../services/authService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Filter, Edit, Trash2, Search, Calendar, Tag, X } from 'lucide-react';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, expense, income
  const [billingCycleDay, setBillingCycleDay] = useState(1); // Jour de début du cycle
  const navigate = useNavigate();

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setBillingCycleDay(profile.billing_cycle_day || 1);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      console.log('Transactions chargées:', data);
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Impossible de supprimer la transaction');
      }
    }
  };

  // Fonction pour obtenir le nom complet de la catégorie (avec parent si sous-catégorie)
  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.name} › ${category.name}` : category.name;
    }
    
    return category.name;
  };

  // Fonction pour obtenir le nom à partir de l'objet category de la transaction
  const getTransactionCategoryName = (transaction) => {
    if (!transaction.category) return 'Sans catégorie';
    
    // Si le backend a déjà fourni le parent_name
    if (transaction.category.parent_name) {
      return `${transaction.category.parent_name} › ${transaction.category.name}`;
    }
    
    // Sinon chercher dans la liste des catégories
    if (transaction.category.parent_id) {
      const parent = categories.find(c => c.id === transaction.category.parent_id);
      return parent ? `${parent.name} › ${transaction.category.name}` : transaction.category.name;
    }
    
    return transaction.category.name;
  };

  // Fonction pour obtenir les dates de début et fin selon la période sélectionnée
  const getPeriodDates = (period) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = billingCycleDay;
    
    switch (period) {
      case 'current':
        // Calculer la période en fonction du cycle de facturation
        if (now.getDate() >= day) {
          // On est dans la période actuelle
          return {
            start: new Date(year, month, day),
            end: new Date(year, month + 1, day - 1, 23, 59, 59)
          };
        } else {
          // On est avant le début du cycle, donc période précédente
          return {
            start: new Date(year, month - 1, day),
            end: new Date(year, month, day - 1, 23, 59, 59)
          };
        }
      case 'last':
        // Période précédente
        if (now.getDate() >= day) {
          return {
            start: new Date(year, month - 1, day),
            end: new Date(year, month, day - 1, 23, 59, 59)
          };
        } else {
          return {
            start: new Date(year, month - 2, day),
            end: new Date(year, month - 1, day - 1, 23, 59, 59)
          };
        }
      case 'thisYear':
        return {
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31, 23, 59, 59)
        };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate + 'T23:59:59') : null
        };
      default:
        return { start: null, end: null };
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Filtre par recherche
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filtre par type (dépense/revenu)
    if (filterType !== 'all') {
      const isExpense = filterType === 'expense';
      if (transaction.is_expense !== isExpense) return false;
    }

    // Filtre par période
    if (selectedPeriod !== 'all') {
      const { start, end } = getPeriodDates(selectedPeriod);
      const transactionDate = new Date(transaction.date);
      
      if (start && transactionDate < start) return false;
      if (end && transactionDate > end) return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">
                {filteredTransactions.length} sur {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  showFilters || selectedPeriod !== 'all' || filterType !== 'all'
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </button>
              <button 
                onClick={() => navigate('/add-transaction')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type de transaction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de transaction
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'expense', label: 'Dépenses' },
                    { key: 'income', label: 'Revenus' }
                  ].map(type => (
                    <button
                      key={type.key}
                      onClick={() => setFilterType(type.key)}
                      className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                        filterType === type.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Période */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'current', label: 'Mois en cours' },
                    { key: 'last', label: 'Mois dernier' },
                    { key: 'thisYear', label: 'Cette année' },
                    { key: 'custom', label: 'Personnalisée' }
                  ].map(period => (
                    <button
                      key={period.key}
                      onClick={() => setSelectedPeriod(period.key)}
                      className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                        selectedPeriod === period.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Plage de dates personnalisée */}
            {selectedPeriod === 'custom' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Bouton pour réinitialiser les filtres */}
            {(selectedPeriod !== 'all' || filterType !== 'all') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedPeriod('all');
                    setFilterType('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher des transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Aucune transaction trouvée' : 'Aucune transaction'}
              </p>
              <button 
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre première transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{transaction.description}</h3>
                        {transaction.category && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <div 
                              className="w-2 h-2 rounded-full mr-1.5" 
                              style={{ backgroundColor: transaction.category.color || '#6b7280' }}
                            />
                            {getTransactionCategoryName(transaction)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.merchant && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{transaction.merchant}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      <div className="text-right mr-4">
                        <div className={`text-xl font-bold ${transaction.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.is_expense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/edit-transaction', { state: { transaction } })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
