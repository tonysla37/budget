import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../services/dashboardService';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { getCurrentPeriod } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, Wallet, Save, Plus, RefreshCw } from 'lucide-react';

export default function DashboardScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const currentPeriod = getCurrentPeriod();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
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

  const CategoryCard = ({ category }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/transactions', { state: { categoryId: category.id } })}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: category.color }} />
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-900">{formatCurrency(category.total)}</span>
        <span className="text-sm text-gray-500">{formatPercentage(category.percentage)}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600 mt-1">{currentPeriod.label}</p>
            </div>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Revenus"
            value={formatCurrency(dashboardData?.total_income || 0)}
            subtitle="Ce mois"
            color="#10b981"
            icon={TrendingUp}
          />
          <StatCard
            title="Dépenses"
            value={formatCurrency(dashboardData?.total_expenses || 0)}
            subtitle="Ce mois"
            color="#ef4444"
            icon={TrendingDown}
          />
          <StatCard
            title="Solde"
            value={formatCurrency((dashboardData?.total_income || 0) - (dashboardData?.total_expenses || 0))}
            subtitle="Net"
            color="#3b82f6"
            icon={Wallet}
          />
          <StatCard
            title="Épargne"
            value={formatCurrency(dashboardData?.savings || 0)}
            subtitle="Objectif"
            color="#8b5cf6"
            icon={Save}
          />
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/transactions/add')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Ajouter une transaction</span>
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Gérer les catégories</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Voir les rapports</span>
            </button>
          </div>
        </div>

        {/* Dépenses par catégorie */}
        {dashboardData?.expenses_by_category && dashboardData.expenses_by_category.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Dépenses par catégorie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.expenses_by_category.map((category, index) => (
                <CategoryCard key={index} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Transactions récentes */}
        {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Transactions récentes</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.recent_transactions.slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${transaction.is_expense ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.is_expense ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.is_expense ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                    {transaction.category && (
                      <p className="text-sm text-gray-500">{transaction.category.name}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bienvenue dans votre tableau de bord !</h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter vos premières transactions pour voir vos statistiques ici.
              </p>
              <button
                onClick={() => navigate('/transactions/add')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ma première transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
