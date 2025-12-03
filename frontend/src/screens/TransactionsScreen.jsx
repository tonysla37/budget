import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/transactionService';
import { getCategories } from '../services/categoryService';
import { getUserProfile } from '../services/authService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getBankStyles } from '../utils/bankUtils';
import { Plus, Filter, Edit, Trash2, Search, Calendar, Tag, X, Wallet } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('transactionsSearchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => localStorage.getItem('transactionsSelectedPeriod') || 'all');
  const [startDate, setStartDate] = useState(() => localStorage.getItem('transactionsStartDate') || '');
  const [endDate, setEndDate] = useState(() => localStorage.getItem('transactionsEndDate') || '');
  const [filterType, setFilterType] = useState(() => localStorage.getItem('transactionsFilterType') || 'all'); // all, expense, income
  const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('transactionsSelectedCategory') || 'all'); // Filtre par catégorie
  const [selectedBank, setSelectedBank] = useState(() => localStorage.getItem('transactionsSelectedBank') || 'all'); // Filtre par banque
  const [billingCycleDay, setBillingCycleDay] = useState(1); // Jour de début du cycle
  const [editingCategoryId, setEditingCategoryId] = useState(null); // ID de la transaction en cours d'édition
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => parseInt(localStorage.getItem('transactionsItemsPerPage')) || 50);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadUserProfile();
  }, []);

  // Persister les filtres dans localStorage
  useEffect(() => {
    localStorage.setItem('transactionsSearchTerm', searchTerm);
    localStorage.setItem('transactionsSelectedPeriod', selectedPeriod);
    localStorage.setItem('transactionsStartDate', startDate);
    localStorage.setItem('transactionsEndDate', endDate);
    localStorage.setItem('transactionsFilterType', filterType);
    localStorage.setItem('transactionsSelectedCategory', selectedCategory);
    localStorage.setItem('transactionsSelectedBank', selectedBank);
    localStorage.setItem('transactionsItemsPerPage', itemsPerPage.toString());
  }, [searchTerm, selectedPeriod, startDate, endDate, filterType, selectedCategory, selectedBank, itemsPerPage]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setBillingCycleDay(profile.billing_cycle_day || 1);
    } catch (error) {
      console.error(t('transactions.errorLoading'), error);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSelectedCategory('all');
    setSelectedBank('all');
    setSelectedPeriod('all');
    setStartDate('');
    setEndDate('');
    localStorage.removeItem('transactionsSearchTerm');
    localStorage.removeItem('transactionsFilterType');
    localStorage.removeItem('transactionsSelectedCategory');
    localStorage.removeItem('transactionsSelectedBank');
    localStorage.removeItem('transactionsSelectedPeriod');
    localStorage.removeItem('transactionsStartDate');
    localStorage.removeItem('transactionsEndDate');
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error(t('transactions.errorLoading'), error);
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
    if (window.confirm(t('transactions.deleteConfirm'))) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert(t('transactions.deleteError'));
      }
    }
  };

  const handleCategoryChange = async (transactionId, newCategoryId) => {
    try {
      await updateTransaction(transactionId, { 
        category_id: newCategoryId === 'uncategorized' ? null : newCategoryId 
      });
      setEditingCategoryId(null);
      await loadTransactions();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      alert('Erreur lors de la mise à jour de la catégorie');
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
    if (!transaction.category) return t('transactions.noCategory');
    
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

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      // Cas spécial : transactions sans catégorie
      if (selectedCategory === 'uncategorized') {
        if (transaction.category_id !== null && transaction.category_id !== undefined) {
          return false;
        }
      } else {
        // Vérifier si c'est la catégorie elle-même ou une sous-catégorie
        const category = categories.find(c => c.id === transaction.category_id);
        if (!category) return false;
        
        // Si la catégorie sélectionnée est une parente, inclure toutes ses sous-catégories
        const selectedCat = categories.find(c => c.id === selectedCategory);
        if (selectedCat && !selectedCat.parent_id) {
          // C'est une catégorie parente, inclure elle-même et ses enfants
          const isMatch = category.id === selectedCategory || category.parent_id === selectedCategory;
          if (!isMatch) return false;
        } else {
          // C'est une sous-catégorie, match exact
          if (category.id !== selectedCategory) return false;
        }
      }
    }

    // Filtre par banque
    if (selectedBank !== 'all') {
      if (selectedBank === 'manual') {
        // Transactions manuelles (sans banque)
        if (transaction.bank?.name) return false;
      } else {
        // Banque spécifique
        if (transaction.bank?.name !== selectedBank) return false;
      }
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

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Réinitialiser à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, selectedCategory, selectedBank, selectedPeriod, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('transactions.loading')}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title')}</h1>
              <p className="text-gray-600 mt-1">
                {filteredTransactions.length} {t('common.search')} {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                {filteredTransactions.length > itemsPerPage && (
                  <span> • Page {currentPage} / {totalPages}</span>
                )}
              </p>
            </div>
            <button 
              onClick={() => navigate('/add-transaction')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('transactions.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Panneau de filtres */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('transactions.filters')}</h3>
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              Réinitialiser les filtres
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type de transaction */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('transactions.typeLabel')}
                </label>
                <div className="flex gap-1.5">
                  {[
                    { key: 'all', label: t('transactions.typeAll') },
                    { key: 'expense', label: t('transactions.typeExpenses') },
                    { key: 'income', label: t('transactions.typeIncome') }
                  ].map(type => (
                    <button
                      key={type.key}
                      onClick={() => setFilterType(type.key)}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
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

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="uncategorized">⚠️ Sans catégorie</option>
                  {categories
                    .filter(c => !c.parent_id)
                    .map(parentCat => {
                      const childCategories = categories.filter(c => c.parent_id === parentCat.id);
                      return (
                        <optgroup key={parentCat.id} label={parentCat.name}>
                          <option value={parentCat.id}>{parentCat.name} (toutes)</option>
                          {childCategories.map(childCat => (
                            <option key={childCat.id} value={childCat.id}>
                              &nbsp;&nbsp;› {childCat.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                </select>
              </div>

              {/* Banque */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Banque d'origine
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les banques</option>
                  <option value="boursobank">BoursoBank</option>
                  <option value="cic">CIC</option>
                  <option value="manual">Saisie manuelle</option>
                </select>
              </div>

              {/* Période */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('transactions.periodLabel')}
                </label>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'all', label: t('transactions.periodAll') },
                      { key: 'current', label: t('transactions.periodCurrent') },
                      { key: 'last', label: t('transactions.periodLast') },
                      { key: 'thisYear', label: t('transactions.periodYear') }
                    ].map(period => (
                      <button
                        key={period.key}
                        onClick={() => setSelectedPeriod(period.key)}
                        className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                          selectedPeriod === period.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedPeriod('custom')}
                    className={`w-full px-3 py-1.5 text-xs rounded-md border font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      selectedPeriod === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar size={12} />
                    {t('transactions.periodCustom')}
                  </button>
                </div>
              </div>
            </div>

          {/* Plage de dates personnalisée */}
          {selectedPeriod === 'custom' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('transactions.startDateLabel')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {t('transactions.endDateLabel')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Bouton pour réinitialiser les filtres */}
          {(selectedPeriod !== 'all' || filterType !== 'all' || selectedCategory !== 'all' || selectedBank !== 'all') && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSelectedPeriod('all');
                  setFilterType('all');
                  setSelectedCategory('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('transactions.resetFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Liste des transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">
                {searchTerm ? t('transactions.noResults') : t('transactions.noTransactions')}
              </p>
              <button 
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('transactions.addFirst')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => {
                const bankStyles = getBankStyles(transaction.bank?.name);
                const isEditingCategory = editingCategoryId === transaction.id;
                return (
                <div key={transaction.id} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Date à gauche */}
                    <div className="flex-shrink-0 w-16 text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </div>
                    
                    {/* Tag banque */}
                    <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded ${bankStyles.badge}`}>
                      {transaction.bank?.name === 'boursobank' ? 'BOURSO' : 
                       transaction.bank?.name === 'cic' ? 'CIC' : 
                       transaction.bank?.name ? transaction.bank.name.toUpperCase() : 'MANUEL'}
                    </span>
                    
                    {/* Description et informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{transaction.description}</h3>
                        {transaction.merchant && (
                          <span className="text-xs text-gray-500 truncate">• {transaction.merchant}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Catégorie - Dropdown ou affichage */}
                    <div className="flex-shrink-0 w-48">
                      {isEditingCategory ? (
                        <select
                          autoFocus
                          value={transaction.category_id || 'uncategorized'}
                          onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                          onBlur={() => setEditingCategoryId(null)}
                          className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="uncategorized">⚠️ Sans catégorie</option>
                          {categories
                            .filter(c => !c.parent_id)
                            .map(parentCat => {
                              const childCategories = categories.filter(c => c.parent_id === parentCat.id);
                              return (
                                <optgroup key={parentCat.id} label={parentCat.name}>
                                  <option value={parentCat.id}>{parentCat.name}</option>
                                  {childCategories.map(childCat => (
                                    <option key={childCat.id} value={childCat.id}>
                                      &nbsp;&nbsp;› {childCat.name}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingCategoryId(transaction.id)}
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          {transaction.category ? (
                            <span className="inline-flex items-center text-xs text-gray-800">
                              <div 
                                className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
                                style={{ backgroundColor: transaction.category.color || '#6b7280' }}
                              />
                              <span className="truncate">{getTransactionCategoryName(transaction)}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">⚠️ Sans catégorie</span>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Compte */}
                    {transaction.account && (
                      <div className="flex-shrink-0 w-24">
                        <span className="text-xs text-gray-600 truncate">{transaction.account.name}</span>
                      </div>
                    )}
                    
                    {/* Montant */}
                    <div className="flex-shrink-0 w-24 text-right">
                      <div className={`text-base font-bold ${transaction.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.is_expense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-1">
                      <button
                        onClick={() => navigate('/edit-transaction', { state: { transaction } })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={t('transactions.editTitle')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('transactions.deleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
              {/* Sélecteur de nombre d'éléments par page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Afficher:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-gray-700">par page</span>
              </div>
              
              {/* Info et navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} sur {filteredTransactions.length}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {/* Pages */}
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Afficher seulement quelques pages autour de la page actuelle
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
