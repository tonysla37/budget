import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { getTransactions } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../i18n';

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expandedBudgets, setExpandedBudgets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [periodType, setPeriodType] = useState('monthly');
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period_type: 'monthly'
  });

  useEffect(() => {
    loadData();
  }, [periodType]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        getBudgets(periodType),
        getCategories(),
        getTransactions()
      ]);
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
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          amount: parseFloat(formData.amount)
        });
      } else {
        await createBudget({
          category_id: formData.category_id,
          amount: parseFloat(formData.amount),
          period_type: periodType
        });
      }
      setShowModal(false);
      setEditingBudget(null);
      setFormData({ category_id: '', amount: '', period_type: 'monthly' });
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
      period_type: budget.period_type
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
    
    // Obtenir le début et la fin du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return allCategoryIds.includes(t.category_id) && 
        t.is_expense &&
        transactionDate >= startOfMonth &&
        transactionDate <= endOfMonth;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Trier par date décroissante
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

  const BudgetCard = ({ budget }) => {
    const status = getBudgetStatus(budget.percentage);
    const StatusIcon = status.icon;
    const progressWidth = Math.min(budget.percentage, 100);
    const isExpanded = expandedBudgets[budget.id];
    const transactionsBySubcategory = getTransactionsBySubcategory(budget.category_id);
    const totalTransactions = transactionsBySubcategory.reduce((sum, group) => sum + group.transactions.length, 0);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-3" 
              style={{ backgroundColor: budget.category_color }}
            />
            <h3 className="text-lg font-semibold text-gray-900">{budget.category_name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(budget)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(budget.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('budgets.allocated')}</span>
            <span className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('budgets.spent')}</span>
            <span className={`font-semibold ${budget.percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(budget.spent)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('budgets.remaining')}</span>
            <span className={`font-semibold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {budget.remaining < 0 ? '- ' : ''}{formatCurrency(Math.abs(budget.remaining))}
            </span>
          </div>

          {/* Barre de progression */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <StatusIcon 
                  size={16} 
                  className={`text-${status.color}-600`}
                />
                <span className={`text-sm font-medium text-${status.color}-600`}>
                  {budget.percentage >= 100 ? `${t('budgets.exceeded')} ${budget.percentage.toFixed(1)}%` : status.text}
                </span>
              </div>
              <span className={`text-sm font-bold ${budget.percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {budget.percentage < 100 ? `${budget.percentage.toFixed(1)}%` : ''}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('budgets.currentMonthTransactions')}</h4>
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
                      {group.transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
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
                      ))}
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

  const availableCategories = categories.filter(
    cat => !budgets.some(b => b.category_id === cat.id)
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
                Gérez vos budgets par catégorie et suivez vos dépenses
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                  setFormData({ category_id: '', amount: '', period_type: periodType });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(budget => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
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

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBudget(null);
                    setFormData({ category_id: '', amount: '', period_type: 'monthly' });
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
