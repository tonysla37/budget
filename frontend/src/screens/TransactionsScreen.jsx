import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/transactionService';
import { getCategories, createCategory } from '../services/categoryService';
import { getUserProfile } from '../services/authService';
import { createRule, applyRuleToAllTransactions, applyRuleToTransaction, applyAllActiveRules } from '../services/ruleService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getBankStyles, getBankDisplayName } from '../utils/bankUtils';
import { Plus, Filter, Edit, Trash2, Search, Calendar, Tag, X, Wallet, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleTransaction, setRuleTransaction] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    pattern: '',
    match_type: 'contains',
    category_id: '',
    applyToExisting: true
  });
  
  // Modal création catégorie
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    parent_id: '',
    color: '#3b82f6',
    icon: '📦'
  });
  const [creatingForTransaction, setCreatingForTransaction] = useState(null);
  
  // États pour les confirmations et messages
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [confirmApplyRules, setConfirmApplyRules] = useState({ isOpen: false, count: 0 });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
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

  const handleDeleteTransaction = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };
  
  const confirmDeleteTransaction = async () => {
    try {
      await deleteTransaction(confirmDelete.id);
      setConfirmDelete({ isOpen: false, id: null });
      setSuccessMessage(t('transactions.deleteSuccess') || 'Transaction supprimée avec succès');
      setTimeout(() => setSuccessMessage(null), 5000);
      loadTransactions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setConfirmDelete({ isOpen: false, id: null });
      setErrorMessage(t('transactions.deleteError') || 'Erreur lors de la suppression');
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
      setErrorMessage('Erreur lors de la mise à jour de la catégorie');
    }
  };

  const openRuleModal = (transaction) => {
    // Extraire un mot-clé de la description (le premier mot significatif)
    const words = transaction.description.split(' ').filter(w => w.length > 3);
    const keyword = words[0] || transaction.description;
    
    setRuleTransaction(transaction);
    setRuleForm({
      name: `Règle auto - ${keyword}`,
      pattern: keyword,
      match_type: 'contains',
      category_id: transaction.category_id || '',
      applyToExisting: true
    });
    setShowRuleModal(true);
  };

  const handleCreateRule = async () => {
    if (!ruleForm.pattern || !ruleForm.category_id) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const createdRule = await createRule({
        name: ruleForm.name,
        pattern: ruleForm.pattern,
        match_type: ruleForm.match_type,
        category_id: ruleForm.category_id,
        is_active: true,
        exceptions: []
      });
      
      // Appliquer aux transactions existantes si demandé
      if (ruleForm.applyToExisting && createdRule.id) {
        const result = await applyRuleToAllTransactions(createdRule.id);
        setSuccessMessage(`Règle créée avec succès ! ${result.message}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        // Recharger les transactions pour voir les changements
        await loadTransactions();
      } else {
        setSuccessMessage('Règle créée avec succès !');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      
      setShowRuleModal(false);
    } catch (error) {
      console.error('Erreur lors de la création de la règle:', error);
      setErrorMessage('Erreur lors de la création de la règle');
    }
  };

  const handleApplyRulesToTransaction = async (transactionId) => {
    try {
      const result = await applyRuleToTransaction(transactionId);
      if (result.matched) {
        setSuccessMessage(`✅ Règle "${result.rule_name}" appliquée !`);
        setTimeout(() => setSuccessMessage(null), 5000);
        await loadTransactions(); // Recharger pour voir le changement
      } else {
        setErrorMessage('ℹ️ Aucune règle ne correspond à cette transaction');
      }
    } catch (error) {
      console.error('Erreur lors de l\'application des règles:', error);
      setErrorMessage('❌ Erreur lors de l\'application des règles');
    }
  };

  const handleApplyAllRules = () => {
    const uncategorized = transactions.filter(t => !t.category_id);
    
    if (uncategorized.length === 0) {
      setErrorMessage('ℹ️ Toutes les transactions sont déjà catégorisées !');
      return;
    }
    
    setConfirmApplyRules({ isOpen: true, count: uncategorized.length });
  };
  
  const confirmApplyAllRules = async () => {
    setConfirmApplyRules({ isOpen: false, count: 0 });
    
    try {
      const result = await applyAllActiveRules();
      
      if (result.matched_count === 0) {
        setErrorMessage(`ℹ️ ${result.total_uncategorized} transaction(s) analysée(s), mais aucune règle ne correspond. Vérifiez vos règles dans l'onglet Règles.`);
      } else {
        setSuccessMessage(`✅ ${result.matched_count} transaction(s) catégorisée(s) sur ${result.total_uncategorized} non catégorisée(s)`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      
      await loadTransactions();
    } catch (error) {
      console.error('Erreur lors de l\'application des règles:', error);
      setErrorMessage('❌ Erreur lors de l\'application des règles');
    }
  };

  // Fonction pour ouvrir la modal de création de catégorie
  const openCategoryModal = (transaction) => {
    setCreatingForTransaction(transaction);
    setCategoryForm({
      name: '',
      type: transaction.is_expense ? 'expense' : 'income',
      parent_id: '',
      color: '#3b82f6',
      icon: '📦'
    });
    setShowCategoryModal(true);
  };

  // Fonction pour créer une catégorie
  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      setErrorMessage('Veuillez entrer un nom de catégorie');
      return;
    }

    try {
      const newCategory = await createCategory({
        name: categoryForm.name,
        type: categoryForm.type,
        parent_id: categoryForm.parent_id ? categoryForm.parent_id : null,
        color: categoryForm.color,
        icon: categoryForm.icon
      });

      // Recharger les catégories
      await loadCategories();
      
      // Si on créait pour une transaction, l'assigner automatiquement
      if (creatingForTransaction && newCategory.id) {
        await handleCategoryChange(creatingForTransaction.id, newCategory.id);
      }
      
      setShowCategoryModal(false);
      setSuccessMessage('Catégorie créée avec succès !');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      setErrorMessage('Erreur lors de la création de la catégorie');
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
            <div className="flex gap-3">
              <button 
                onClick={handleApplyAllRules}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                title="Appliquer toutes les règles actives aux transactions non catégorisées"
              >
                <Filter className="h-4 w-4 mr-2" />
                Appliquer les règles
              </button>
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
                      {transaction.bank?.name ? getBankDisplayName(transaction.bank.name) : 'MANUEL'}
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
                    <div className="flex-shrink-0 w-44 mr-2">
                      {isEditingCategory ? (
                        <select
                          autoFocus
                          value={transaction.category_id || 'uncategorized'}
                          onChange={(e) => {
                            if (e.target.value === 'create_new') {
                              setEditingCategoryId(null);
                              openCategoryModal(transaction);
                            } else {
                              handleCategoryChange(transaction.id, e.target.value);
                            }
                          }}
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
                          <option value="create_new" className="font-semibold text-blue-600">
                            ➕ Nouvelle catégorie
                          </option>
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
                      <div className="flex-shrink-0 w-20 mr-2">
                        <span className="text-xs text-gray-600 truncate">{transaction.account.name}</span>
                      </div>
                    )}
                    
                    {/* Montant */}
                    <div className="flex-shrink-0 w-28 text-right">
                      <div className={`text-base font-bold ${transaction.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.is_expense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-1">
                      <button
                        onClick={() => openRuleModal(transaction)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Créer une règle automatique"
                      >
                        <Sparkles size={14} />
                      </button>
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

      {/* Modal de création de règle */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} />
                Créer une règle automatique
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {ruleTransaction && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Transaction de référence :</p>
                <p className="text-sm font-medium text-gray-900">{ruleTransaction.description}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Règle auto - Amazon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot-clé à rechercher *
                </label>
                <input
                  type="text"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: AMAZON, CARREFOUR..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de correspondance
                </label>
                <select
                  value={ruleForm.match_type}
                  onChange={(e) => setRuleForm({ ...ruleForm, match_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="contains">Contient le mot-clé</option>
                  <option value="starts_with">Commence par</option>
                  <option value="ends_with">Se termine par</option>
                  <option value="exact">Correspondance exacte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie à appliquer *
                </label>
                <select
                  value={ruleForm.category_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez une catégorie</option>
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
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>💡 Astuce :</strong> Cette règle s'appliquera automatiquement à toutes les futures transactions contenant le mot-clé "{ruleForm.pattern}".
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="applyToExisting"
                  checked={ruleForm.applyToExisting}
                  onChange={(e) => setRuleForm({ ...ruleForm, applyToExisting: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="applyToExisting" className="ml-2 text-sm text-gray-700">
                  Appliquer cette règle aux transactions existantes
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRule}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Créer la règle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création de Catégorie */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tag size={24} className="text-blue-600" />
                Nouvelle Catégorie
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Courses, Transport..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie parente (optionnel)
                </label>
                <select
                  value={categoryForm.parent_id || ''}
                  onChange={(e) => {
                    const parentId = e.target.value || '';
                    const parent = categories.find(c => c.id === parentId);
                    setCategoryForm({ 
                      ...categoryForm, 
                      parent_id: parentId,
                      color: parent ? parent.color : categoryForm.color,
                      icon: parent ? parent.icon : categoryForm.icon
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {categories
                    .filter(c => !c.parent_id && c.type === categoryForm.type)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{categoryForm.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icône
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl"
                    placeholder="📦"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 La catégorie sera automatiquement assignée à la transaction en cours.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={confirmDeleteTransaction}
        title="Supprimer la transaction"
        message="Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmApplyRules.isOpen}
        onClose={() => setConfirmApplyRules({ isOpen: false, count: 0 })}
        onConfirm={confirmApplyAllRules}
        title="Appliquer les règles actives"
        message={`Voulez-vous appliquer les règles actives aux ${confirmApplyRules.count} transaction(s) non catégorisée(s) ?`}
        confirmText="Appliquer"
        cancelText="Annuler"
        variant="info"
      />

      {/* Messages de succès et d'erreur */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fadeIn">
          <span className="text-green-600">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fadeIn">
          <span className="text-red-600">⚠</span>
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-red-600 hover:text-red-800 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
