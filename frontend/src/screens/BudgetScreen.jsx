import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { getTransactions } from '../services/transactionService';
import { getCurrentUser } from '../services/authService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getBankStyles, getBankDisplayName } from '../utils/bankUtils';
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Calendar, LayoutGrid, List } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function BudgetScreen() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expandedBudgets, setExpandedBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('separated'); // 'separated' ou 'hierarchical'
  const [editingBudget, setEditingBudget] = useState(null);
  const [periodType, setPeriodType] = useState('monthly');
  const [billingCycleDay, setBillingCycleDay] = useState(1);
  const [periodDates, setPeriodDates] = useState({ start: null, end: null });
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period_type: 'monthly',
    is_recurring: true,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    loadUserSettings();
    loadData();
  }, [periodType]);

  const loadUserSettings = async () => {
    try {
      const user = await getCurrentUser();
      const cycleDay = user.billing_cycle_day || 1;
      setBillingCycleDay(cycleDay);
      
      // Calculer les dates de période
      const now = new Date();
      let startDate, endDate;
      
      if (periodType === 'monthly') {
        if (now.getDate() >= cycleDay) {
          startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay);
          if (now.getMonth() === 11) {
            endDate = new Date(now.getFullYear() + 1, 0, cycleDay);
          } else {
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, cycleDay);
          }
        } else {
          if (now.getMonth() === 0) {
            startDate = new Date(now.getFullYear() - 1, 11, cycleDay);
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, cycleDay);
          }
          endDate = new Date(now.getFullYear(), now.getMonth(), cycleDay);
        }
      } else { // yearly
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }
      
      setPeriodDates({ start: startDate, end: endDate });
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        getBudgets(periodType),
        getCategories(),
        getTransactions()
      ]);
      console.log('Categories loaded:', categoriesData);
      console.log('Categories after filter:', categoriesData.filter(cat => cat.type === 'expense'));
      setBudgets(budgetsData);
      setCategories(categoriesData.filter(cat => cat.type === 'expense'));
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period_type: periodType,
        is_recurring: formData.is_recurring
      };

      // Ajouter year et month seulement si c'est un budget ponctuel
      if (!formData.is_recurring) {
        budgetData.year = parseInt(formData.year);
        budgetData.month = parseInt(formData.month);
      }

      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          amount: parseFloat(formData.amount)
        });
      } else {
        await createBudget(budgetData);
      }
      setShowModal(false);
      setEditingBudget(null);
      setFormData({ 
        category_id: '', 
        amount: '', 
        period_type: 'monthly',
        is_recurring: true,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.message || t('budgets.genericError'));
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period_type: budget.period_type,
      is_recurring: budget.is_recurring !== false, // Par défaut true si non défini
      year: budget.year || new Date().getFullYear(),
      month: budget.month || new Date().getMonth() + 1
    });
    setShowModal(true);
  };

  const handleDelete = async (budgetId) => {
    if (!confirm(t('budgets.deleteConfirm'))) return;
    try {
      await deleteBudget(budgetId);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getBudgetStatus = (percentage) => {
    if (percentage >= 100) return { color: 'red', icon: AlertTriangle, text: '' };
    if (percentage >= 80) return { color: 'orange', icon: AlertCircle, text: t('budgets.statusWarning') };
    return { color: 'green', icon: CheckCircle2, text: t('budgets.statusOk') };
  };

  const toggleBudgetExpansion = (budgetId) => {
    setExpandedBudgets(prev => ({
      ...prev,
      [budgetId]: !prev[budgetId]
    }));
  };

  const getBudgetTransactions = (categoryId) => {
    // Trouver toutes les sous-catégories de cette catégorie
    const subcategoryIds = categories
      .filter(cat => cat.parent_id === categoryId)
      .map(cat => cat.id);
    
    // Inclure la catégorie parente et toutes ses sous-catégories
    const allCategoryIds = [categoryId, ...subcategoryIds];
    
    // Utiliser les dates de période calculées avec billing_cycle_day
    if (!periodDates.start || !periodDates.end) {
      return [];
    }
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return allCategoryIds.includes(t.category_id) && 
        t.is_expense &&
        transactionDate >= periodDates.start &&
        transactionDate < periodDates.end;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getTransactionsBySubcategory = (categoryId) => {
    const allTransactions = getBudgetTransactions(categoryId);
    const grouped = {};
    
    allTransactions.forEach(transaction => {
      const txCategory = categories.find(c => c.id === transaction.category_id);
      if (!txCategory) return;
      
      // Si c'est une sous-catégorie, grouper par son nom
      const groupKey = txCategory.parent_id ? txCategory.id : 'parent';
      const groupName = txCategory.parent_id ? txCategory.name : t('dashboard.others');
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          name: groupName,
          color: txCategory.color || '#6b7280', // Couleur de la sous-catégorie
          transactions: [],
          total: 0
        };
      }
      
      grouped[groupKey].transactions.push(transaction);
      grouped[groupKey].total += transaction.amount;
    });
    
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  };

  const BudgetCard = ({ budget, isSubcategory = false, isHierarchical = false }) => {
    const status = getBudgetStatus(budget.percentage);
    const StatusIcon = status.icon;
    const progressWidth = Math.min(budget.percentage, 100);
    const isExpanded = expandedBudgets[budget.id];
    const transactionsBySubcategory = getTransactionsBySubcategory(budget.category_id);
    const totalTransactions = transactionsBySubcategory.reduce((sum, group) => sum + group.transactions.length, 0);

    return (
      <div className={`${isHierarchical ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow'} ${isSubcategory && !isHierarchical ? 'border-l-4' : ''}`}
           style={isSubcategory && !isHierarchical ? { borderLeftColor: budget.category_color } : {}}>
        <div className={`flex items-center justify-between ${isHierarchical ? 'mb-1.5' : 'mb-3'}`}>
          <div className={`flex items-center ${isHierarchical ? 'gap-1' : 'gap-2'}`}>
            <div 
              className={`${isHierarchical ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full`}
              style={{ backgroundColor: budget.category_color }}
            />
            <div>
              <div className={`flex items-center ${isHierarchical ? 'gap-1' : 'gap-2'}`}>
                <h3 className={`${isHierarchical ? 'text-base' : 'text-base'} font-semibold text-gray-900`}>{budget.category_name}</h3>
                {budget.is_recurring !== false ? (
                  <span className={`inline-flex items-center gap-1 ${isHierarchical ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'} font-medium bg-blue-100 text-blue-700 rounded`} title={t('budgets.recurring')}>
                    <RefreshCw size={isHierarchical ? 10 : 12} />
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 ${isHierarchical ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'} font-medium bg-purple-100 text-purple-700 rounded`}>
                    <Calendar size={isHierarchical ? 10 : 12} />
                    {new Date(budget.year, budget.month - 1).toLocaleDateString(window.i18n?.language || 'fr', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`flex items-center ${isHierarchical ? 'gap-1' : 'gap-2'}`}>
            <button
              onClick={() => handleEdit(budget)}
              className={`${isHierarchical ? 'p-1' : 'p-1.5'} text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
            >
              <Pencil size={isHierarchical ? 14 : 16} />
            </button>
            <button
              onClick={() => handleDelete(budget.id)}
              className={`${isHierarchical ? 'p-1' : 'p-1.5'} text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
            >
              <Trash2 size={isHierarchical ? 14 : 16} />
            </button>
          </div>
        </div>

        <div className={isHierarchical ? 'space-y-1' : 'space-y-2'}>
          <div className={`flex justify-between ${isHierarchical ? 'text-sm' : 'text-sm'}`}>
            <span className="text-gray-600">{t('budgets.allocated')}</span>
            <span className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
          </div>
          
          <div className={`flex justify-between ${isHierarchical ? 'text-sm' : 'text-sm'}`}>
            <span className="text-gray-600">{t('budgets.spent')}</span>
            <span className={`font-semibold ${budget.percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(budget.spent)}
            </span>
          </div>

          <div className={`flex justify-between ${isHierarchical ? 'text-sm' : 'text-sm'}`}>
            <span className="text-gray-600">{t('budgets.remaining')}</span>
            <span className={`font-semibold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {budget.remaining < 0 ? '- ' : ''}{formatCurrency(Math.abs(budget.remaining))}
            </span>
          </div>

          {/* Barre de progression */}
          <div className={isHierarchical ? 'mt-1.5' : 'mt-3'}>
            <div className={`flex justify-between items-center ${isHierarchical ? 'mb-1' : 'mb-1.5'}`}>
              <div className={`flex items-center ${isHierarchical ? 'gap-1' : 'gap-2'}`}>
                <StatusIcon 
                  size={isHierarchical ? 12 : 14}
                  className={status.color === 'red' ? 'text-red-600' : status.color === 'orange' ? 'text-orange-600' : 'text-green-600'}
                />
                <span className={`${isHierarchical ? 'text-sm' : 'text-sm'} font-medium ${status.color === 'red' ? 'text-red-600' : status.color === 'orange' ? 'text-orange-600' : 'text-green-600'}`}>
                  {budget.percentage > 100 ? `${t('budgets.exceeded')} ${budget.percentage.toFixed(1)}%` : budget.percentage === 100 ? `Atteint : 100%` : status.text}
                </span>
              </div>
              <span className={`${isHierarchical ? 'text-sm' : 'text-sm'} font-bold ${budget.percentage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {budget.percentage < 100 ? `${budget.percentage.toFixed(1)}%` : budget.percentage === 100 ? '' : ''}
              </span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full ${isHierarchical ? 'h-2' : 'h-2.5'} overflow-hidden`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.percentage >= 100 ? 'bg-red-500' :
                  budget.percentage >= 80 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          {/* Bouton pour voir les transactions */}
          {totalTransactions > 0 && (
            <button
              onClick={() => toggleBudgetExpansion(budget.id)}
              className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} />
                  {t('budgets.hideTransactions')}
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  {t('budgets.showTransactions')} ({totalTransactions})
                </>
              )}
            </button>
          )}

          {/* Liste des transactions groupées par sous-catégorie */}
          {isExpanded && totalTransactions > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {periodType === 'monthly' ? t('budgets.currentMonthTransactions') : t('budgets.currentYearTransactions')}
              </h4>
              <div className="space-y-4">
                {transactionsBySubcategory.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* En-tête de groupe (sous-catégorie) */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        ></div>
                        <span className="text-xs font-semibold text-gray-700 uppercase">
                          {group.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-red-600">
                        -{formatCurrency(group.total)}
                      </span>
                    </div>
                    
                    {/* Transactions de la sous-catégorie */}
                    <div className="space-y-1.5 ml-4">
                      {group.transactions.map((transaction) => {
                        const bankStyles = getBankStyles(transaction.bank?.name);
                        return (
                        <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Tag de la banque ou manuel */}
                              <span className={`px-2 py-0.5 text-xs rounded ${bankStyles.badge}`}>
                                {transaction.bank?.name ? getBankDisplayName(transaction.bank.name) : 'MANUEL'}
                              </span>
                              <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.date)}
                              {transaction.merchant && (
                                <>
                                  <span className="mx-1">•</span>
                                  {transaction.merchant}
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-red-600">
                            -{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('budgets.loading')}</p>
        </div>
      </div>
    );
  }

  const availableCategories = editingBudget 
    ? categories // En mode édition, montrer toutes les catégories
    : categories.filter(
        cat => !budgets.some(b => 
          b.category_id === cat.id && 
          b.period_type === periodType && 
          b.is_recurring === formData.is_recurring &&
          (!formData.is_recurring ? (b.year === formData.year && b.month === formData.month) : true)
        )
      );

  // Fonction pour obtenir le nom complet de la catégorie
  const getCategoryDisplayName = (category) => {
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.name} › ${category.name}` : category.name;
    }
    return category.name;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('budgets.title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('budgets.subtitle')}
              </p>
              {periodDates.start && periodDates.end && (
                <p className="text-sm text-blue-600 mt-1">
                  📅 Période : {formatDate(periodDates.start)} → {formatDate(periodDates.end)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Boutons de basculement de vue */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('separated')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'separated' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue séparée"
                >
                  <LayoutGrid size={16} />
                  Séparée
                </button>
                <button
                  onClick={() => setViewMode('hierarchical')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'hierarchical' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Vue hiérarchique"
                >
                  <List size={16} />
                  Hiérarchique
                </button>
              </div>
              
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">{t('budgets.periodMonthly')}</option>
                <option value="yearly">{t('budgets.periodYearly')}</option>
              </select>
              <button
                  onClick={() => {
                  setEditingBudget(null);
                  setFormData({ 
                    category_id: '', 
                    amount: '', 
                    period_type: periodType,
                    is_recurring: true,
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1
                  });
                  setShowModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('budgets.add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Synthèse budgets vs revenus */}
        {budgets.length > 0 && periodDates.start && periodDates.end && (() => {
          // Ne compter que les budgets des catégories principales (sans parent)
          const mainCategoryBudgets = budgets.filter(b => {
            const cat = categories.find(c => c.id === b.category_id);
            return cat && !cat.parent_id;
          });
          
          // Calculer le total des budgets alloués (uniquement catégories principales)
          const totalBudgetsAlloues = mainCategoryBudgets.reduce((sum, b) => sum + b.amount, 0);
          
          // Calculer le total des revenus pour la période
          const startStr = periodDates.start.toISOString().split('T')[0];
          const endStr = periodDates.end.toISOString().split('T')[0];
          
          const incomeTransactions = transactions.filter(t => 
            !t.is_expense && 
            t.date >= startStr && 
            t.date < endStr
          );
          const totalRevenus = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          // Calculer le total dépensé (uniquement catégories principales - déjà agrégé par le backend)
          const totalDepense = mainCategoryBudgets.reduce((sum, b) => sum + b.spent, 0);
          
          // Calculer le reste disponible
          const resteDisponible = totalRevenus - totalBudgetsAlloues;
          const pourcentageAlloue = totalRevenus > 0 ? (totalBudgetsAlloues / totalRevenus * 100) : 0;
          const pourcentageDepense = totalBudgetsAlloues > 0 ? (totalDepense / totalBudgetsAlloues * 100) : 0;
          
          return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border-2 border-blue-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Synthèse {periodType === 'monthly' ? 'mensuelle' : 'annuelle'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenus */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Revenus</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenus)}</p>
                </div>
                
                {/* Budgets alloués */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Budgets alloués</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudgetsAlloues)}</p>
                  <p className="text-xs text-gray-500 mt-1">{pourcentageAlloue.toFixed(1)}% des revenus</p>
                </div>
                
                {/* Dépenses réelles */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Dépenses réelles</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDepense)}</p>
                  <p className="text-xs text-gray-500 mt-1">{pourcentageDepense.toFixed(1)}% des budgets</p>
                </div>
                
                {/* Reste disponible */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Reste disponible</p>
                  <p className={`text-2xl font-bold ${resteDisponible >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(resteDisponible))}
                  </p>
                  {resteDisponible < 0 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Sur-allocation</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        
        {budgets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun budget défini
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer un budget pour une catégorie de dépenses
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('budgets.add')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {viewMode === 'separated' ? (
              // Mode séparé (vue actuelle)
              <>
                {/* Grouper les budgets par catégorie parente */}
                {(() => {
                  // Séparer les budgets en catégories parentes et enfants
                  const parentBudgets = budgets.filter(b => {
                    const cat = categories.find(c => c.id === b.category_id);
                    return cat && !cat.parent_id;
                  });
                  
                  const childBudgets = budgets.filter(b => {
                    const cat = categories.find(c => c.id === b.category_id);
                    return cat && cat.parent_id;
                  });

                  return (
                    <>
                      {/* Budgets des catégories parentes */}
                      {parentBudgets.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span>Catégories principales</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {parentBudgets.map(budget => (
                              <BudgetCard key={budget.id} budget={budget} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Budgets des sous-catégories */}
                      {childBudgets.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span>Sous-catégories</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {childBudgets.map(budget => {
                              const cat = categories.find(c => c.id === budget.category_id);
                              const parent = cat?.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
                              return (
                                <div key={budget.id} className="relative">
                                  {parent && (
                                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: parent.color || '#6b7280' }}></div>
                                      <span>{parent.name}</span>
                                      <span>›</span>
                                    </div>
                                  )}
                                  <BudgetCard budget={budget} isSubcategory={true} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              // Mode hiérarchique (groupé par parent)
              <div className="space-y-6">
                {(() => {
                  // Grouper les budgets par catégorie parente
                  const parentCategories = categories.filter(c => !c.parent_id);
                  
                  return parentCategories.map(parentCat => {
                    // Budget de la catégorie parente
                    const parentBudget = budgets.find(b => b.category_id === parentCat.id);
                    
                    // Budgets des sous-catégories
                    const childCategories = categories.filter(c => c.parent_id === parentCat.id);
                    const childBudgets = budgets.filter(b => 
                      childCategories.some(cc => cc.id === b.category_id)
                    );
                    
                    // N'afficher que si au moins un budget existe (parent ou enfant)
                    if (!parentBudget && childBudgets.length === 0) return null;
                    
                    // Calculer si les sous-catégories dépassent le budget parent
                    const totalChildBudgets = childBudgets.reduce((sum, b) => sum + b.amount, 0);
                    const hasOverallocation = parentBudget && totalChildBudgets > parentBudget.amount;
                    
                    return (
                      <div key={parentCat.id} className={`bg-white rounded-lg shadow-sm border-2 ${hasOverallocation ? 'border-red-300' : 'border-gray-200'} overflow-hidden`}>
                        {/* Header de la catégorie parente */}
                        <div className={`bg-gradient-to-r ${hasOverallocation ? 'from-red-50 to-orange-50' : 'from-gray-50 to-gray-100'} px-3 py-2 border-b ${hasOverallocation ? 'border-red-200' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm" 
                              style={{ backgroundColor: parentCat.color }}
                            />
                            <h3 className="text-base font-bold text-gray-900">{parentCat.name}</h3>
                            {(parentBudget || childBudgets.length > 0) && (
                              <span className="ml-auto text-xs text-gray-500">
                                {parentBudget ? '1' : '0'} principal · {childBudgets.length} sous-catégorie{childBudgets.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {hasOverallocation && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                <AlertTriangle size={12} />
                                Sur-allocation
                              </span>
                            )}
                          </div>
                          {hasOverallocation && (
                            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Sous-catégories : {formatCurrency(totalChildBudgets)} / Budget parent : {formatCurrency(parentBudget.amount)}
                            </div>
                          )}
                        </div>
                        
                        {/* Contenu */}
                        <div className="p-2 space-y-2">
                          {/* Budget parent si existe */}
                          {parentBudget && (
                            <div className="pb-2 border-b border-gray-200">
                              <BudgetCard budget={parentBudget} isHierarchical={true} />
                            </div>
                          )}
                          
                          {/* Budgets enfants */}
                          {childBudgets.length > 0 && (
                            <div className="space-y-2">
                              {parentBudget && (
                                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                                  <div className="h-px bg-gray-300 flex-1"></div>
                                  <span>Sous-catégories</span>
                                  <div className="h-px bg-gray-300 flex-1"></div>
                                </h4>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {childBudgets.map(budget => (
                                  <div key={budget.id} className="bg-gray-50 rounded-lg p-1.5">
                                    <BudgetCard budget={budget} isSubcategory={true} isHierarchical={true} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingBudget ? t('budgets.modalTitleEdit') : t('budgets.modalTitle')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('budgets.categoryLabel')}
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('budgets.categoryPlaceholder')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getCategoryDisplayName(cat)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('budgets.amountLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder={t('budgets.amountPlaceholder')}
                />
              </div>

              {!editingBudget && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('budgets.typeLabel')}
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="is_recurring"
                          checked={formData.is_recurring}
                          onChange={() => setFormData({ ...formData, is_recurring: true })}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{t('budgets.recurring')}</div>
                          <div className="text-sm text-gray-500">S'applique automatiquement chaque mois</div>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="is_recurring"
                          checked={!formData.is_recurring}
                          onChange={() => setFormData({ ...formData, is_recurring: false })}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{t('budgets.oneTime')}</div>
                          <div className="text-sm text-gray-500">Pour un mois spécifique uniquement</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {!formData.is_recurring && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('budgets.monthLabel')}
                        </label>
                        <select
                          value={formData.month}
                          onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                            <option key={m} value={m}>
                              {new Date(2000, m - 1).toLocaleDateString(window.i18n?.language || 'fr', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('budgets.yearLabel')}
                        </label>
                        <select
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          {[...Array(3)].map((_, i) => {
                            const year = new Date().getFullYear() + i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(null);
                    setFormData({ 
                      category_id: '', 
                      amount: '', 
                      period_type: 'monthly',
                      is_recurring: true,
                      year: new Date().getFullYear(),
                      month: new Date().getMonth() + 1
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('budgets.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBudget ? t('budgets.edit') : t('budgets.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
