import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../services/dashboardService';
import { getCategories } from '../services/categoryService';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { getCurrentPeriod, getPeriodLabel } from '../utils/dateUtils';
import { useTranslation } from '../i18n';
import { TrendingUp, TrendingDown, Wallet, Save, Plus, RefreshCw } from 'lucide-react';

export default function DashboardScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Recalculer currentPeriod quand la langue change
  const currentPeriod = useMemo(() => getCurrentPeriod(), [i18n?.language]);

  // Générer le label de période à partir des dates du backend
  const periodLabel = useMemo(() => {
    if (dashboardData?.period?.start) {
      return getPeriodLabel(dashboardData.period.start, dashboardData.period.end);
    }
    return currentPeriod.label;
  }, [dashboardData?.period?.start, dashboardData?.period?.end, i18n?.language, currentPeriod.label]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Chargement du dashboard...', { selectedPeriod, customStartDate, customEndDate });
      const data = await getDashboardData(selectedPeriod, customStartDate, customEndDate);
      console.log('✅ Données du dashboard reçues:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Fonction pour obtenir le nom à partir de l'objet category de la transaction
  const getTransactionCategoryName = (transaction) => {
    if (!transaction.category) return t('dashboard.noCategory');
    
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, color, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon size={24} color={color} />
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  const CategoryCard = ({ category }) => {
    // Afficher "Parent › Sous-catégorie" si c'est une sous-catégorie
    const displayName = category.parent_name 
      ? `${category.parent_name} › ${category.name}`
      : category.name;
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/transactions', { state: { categoryId: category.id } })}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: category.color }} />
            <span className="font-medium text-gray-900">{displayName}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">{formatCurrency(category.total)}</span>
          <span className="text-sm text-gray-500">{formatPercentage(category.percentage)}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-gray-600 mt-1">
                {periodLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current">{t('dashboard.currentPeriodLabel')}</option>
                <option value="previous">{t('dashboard.previousPeriod')}</option>
                <option value="year">{t('dashboard.thisYear')}</option>
                <option value="custom">{t('dashboard.custom')}</option>
              </select>
              
              {selectedPeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('filters.startDatePlaceholder')}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('filters.endDatePlaceholder')}
                  />
                </>
              )}
              
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {t('dashboard.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.income')}
            value={formatCurrency(dashboardData?.total_income || 0)}
            subtitle={t('dashboard.thisMonth')}
            color="#10b981"
            icon={TrendingUp}
          />
          <StatCard
            title={t('dashboard.expenses')}
            value={formatCurrency(dashboardData?.total_expenses || 0)}
            subtitle={t('dashboard.thisMonth')}
            color="#ef4444"
            icon={TrendingDown}
          />
          <StatCard
            title={t('dashboard.netBalance')}
            value={formatCurrency((dashboardData?.total_income || 0) - (dashboardData?.total_expenses || 0))}
            subtitle={t('dashboard.net')}
            color="#3b82f6"
            icon={Wallet}
          />
          <StatCard
            title={t('dashboard.savings')}
            value={formatCurrency(dashboardData?.savings || 0)}
            subtitle={t('dashboard.objective')}
            color="#8b5cf6"
            icon={Save}
          />
        </div>

        {/* Top Dépenses */}
        {dashboardData?.recent_transactions && dashboardData.recent_transactions.filter(t => t.is_expense).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.topExpenses')}</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {t('dashboard.viewAll')}
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.recent_transactions
                .filter(t => t.is_expense)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-full font-bold mr-4">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                          {transaction.merchant && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-sm text-gray-600">{transaction.merchant}</p>
                            </>
                          )}
                          {transaction.category && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-sm text-gray-600">{getTransactionCategoryName(transaction)}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/add-transaction')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">{t('dashboard.addTransaction')}</span>
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">{t('dashboard.manageCategories')}</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">{t('dashboard.viewReports')}</span>
            </button>
          </div>
        </div>

        {/* Aperçu des budgets */}
        {dashboardData?.budget_info && dashboardData.budget_info.total_budget > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.budgetOverview')}</h2>
              <button
                onClick={() => navigate('/budgets')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {t('dashboard.viewAll')}
              </button>
            </div>

            {/* Carte de synthèse globale */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">{t('dashboard.totalBudget')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(dashboardData.budget_info.total_budget)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-1">{t('dashboard.totalSpent')}</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(dashboardData.budget_info.total_spent)}
                </p>
              </div>
              <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                dashboardData.budget_info.total_remaining >= 0
                  ? 'from-green-50 to-green-100 border-green-200'
                  : 'from-red-50 to-red-100 border-red-200'
              }`}>
                <p className={`text-sm font-medium mb-1 ${
                  dashboardData.budget_info.total_remaining >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {t('dashboard.totalRemaining')}
                </p>
                <p className={`text-2xl font-bold ${
                  dashboardData.budget_info.total_remaining >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(Math.abs(dashboardData.budget_info.total_remaining))}
                </p>
              </div>
            </div>

            {/* Barre de progression globale */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('dashboard.budgetUsage')}</span>
                <span className="text-sm font-bold text-gray-900">
                  {dashboardData.budget_info.usage_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dashboardData.budget_info.usage_percentage >= 100
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : dashboardData.budget_info.usage_percentage >= 80
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{ width: `${Math.min(dashboardData.budget_info.usage_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Liste des budgets individuels */}
            {dashboardData.budget_info.budgets && dashboardData.budget_info.budgets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Par catégorie</h3>
                {dashboardData.budget_info.budgets.map((budget, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: budget.category_color }}
                        />
                        <span className="font-medium text-gray-900">{budget.category_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            budget.percentage >= 100
                              ? 'bg-red-500'
                              : budget.percentage >= 80
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold min-w-[60px] text-right ${
                        budget.percentage >= 100
                          ? 'text-red-600'
                          : budget.percentage >= 80
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message si pas de budget */}
        {dashboardData?.budget_info && dashboardData.budget_info.total_budget === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-8 mb-8 text-center">
            <Wallet className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.noBudgets')}</h3>
            <p className="text-gray-600 mb-4">Définissez des budgets pour mieux contrôler vos dépenses</p>
            <button
              onClick={() => navigate('/budgets')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('dashboard.createBudget')}
            </button>
          </div>
        )}

        {/* Dépenses par catégorie */}
        {dashboardData?.expenses_by_category && dashboardData.expenses_by_category.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.expensesByCategory')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.expenses_by_category.map((category, index) => (
                <CategoryCard key={index} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Revenus par catégorie */}
        {dashboardData?.income_by_category && dashboardData.income_by_category.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.incomeByCategory')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.income_by_category.map((category, index) => (
                <CategoryCard key={index} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Transactions récentes */}
        {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.recentTransactions')}</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('dashboard.viewAll')}
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.recent_transactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${transaction.is_expense ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.date)}
                        {transaction.merchant && (
                          <>
                            <span className="mx-1">•</span>
                            {transaction.merchant}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.is_expense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    {transaction.category && (
                      <p className="text-sm text-gray-500">{getTransactionCategoryName(transaction)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {(!dashboardData || 
          (!dashboardData.total_income && !dashboardData.total_expenses && 
           (!dashboardData.recent_transactions || dashboardData.recent_transactions.length === 0))) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.welcomeMessage')}</h3>
              <p className="text-gray-600 mb-6">
                {t('dashboard.welcomeSubtitle')}
              </p>
              <button
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.addFirstTransaction')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
