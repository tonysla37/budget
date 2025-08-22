import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../services/dashboardService';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { getCurrentPeriod } from '../utils/dateUtils';
import { COLORS } from '../utils/colors';
import { TrendingUp, TrendingDown, Wallet, Save, Plus } from 'lucide-react';

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
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-header">
        <Icon size={24} color={color} />
        <h3 className="stat-title">{title}</h3>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );

  const CategoryCard = ({ category }) => (
    <div 
      className="category-card"
      onClick={() => navigate('/transactions', { state: { categoryId: category.id } })}
    >
      <div className="category-header">
        <div className="category-color" style={{ backgroundColor: category.color }} />
        <span className="category-name">{category.name}</span>
      </div>
      <div className="category-stats">
        <span className="category-amount">{formatCurrency(category.total)}</span>
        <span className="category-percentage">{formatPercentage(category.percentage)}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-text">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tableau de bord</h1>
        <p className="dashboard-subtitle">{currentPeriod.label}</p>
      </div>

      {/* Statistiques principales */}
      <div className="stats-container">
        <StatCard
          title="Revenus"
          value={formatCurrency(dashboardData?.total_income || 0)}
          subtitle="Ce mois"
          color={COLORS.success}
          icon={TrendingUp}
        />
        <StatCard
          title="Dépenses"
          value={formatCurrency(dashboardData?.total_expenses || 0)}
          subtitle="Ce mois"
          color={COLORS.danger}
          icon={TrendingDown}
        />
      </div>

      <div className="stats-container">
        <StatCard
          title="Solde"
          value={formatCurrency(dashboardData?.balance || 0)}
          subtitle="Solde actuel"
          color={COLORS.primary}
          icon={Wallet}
        />
        <StatCard
          title="Épargne"
          value={formatPercentage(dashboardData?.savings_rate || 0)}
          subtitle="Taux d'épargne"
          color={COLORS.secondary}
          icon={Save}
        />
      </div>

      {/* Actions rapides */}
      <div className="actions-container">
        {dashboardData && (
          <>
            {/* Résumé financier */}
            <div className="summary-card">
              <h2 className="card-title">Résumé du mois</h2>
              <div className="summary-row">
                <div className="summary-item">
                  <span className="summary-label">Revenus</span>
                  <span className="summary-value income">
                    {formatCurrency(dashboardData.totalIncome)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Dépenses</span>
                  <span className="summary-value expense">
                    {formatCurrency(dashboardData.totalExpenses)}
                  </span>
                </div>
              </div>
              <div className="balance-row">
                <span className="balance-label">Solde</span>
                <span className={`balance-value ${dashboardData.balance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(dashboardData.balance)}
                </span>
              </div>
            </div>

            {/* Dépenses par catégorie */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Dépenses par catégorie</h2>
                <button 
                  className="see-all-button"
                  onClick={() => navigate('/categories')}
                >
                  Voir tout
                </button>
              </div>
              {dashboardData.topCategories.map((category) => (
                <div key={category.id} className="category-row">
                  <div className="category-info">
                    <div className="category-color" style={{ backgroundColor: category.color }} />
                    <span className="category-name">{category.name}</span>
                  </div>
                  <span className="category-amount">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
              ))}
            </div>

            {/* Transactions récentes */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Transactions récentes</h2>
                <button 
                  className="see-all-button"
                  onClick={() => navigate('/transactions')}
                >
                  Voir tout
                </button>
              </div>
              {dashboardData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-row">
                  <div className="transaction-info">
                    <span className="transaction-description">
                      {transaction.description}
                    </span>
                    <span className="transaction-category">
                      {transaction.category_name}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <span className={`transaction-value ${transaction.is_expense ? 'expense' : 'income'}`}>
                      {transaction.is_expense ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </span>
                    <span className="transaction-date">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bouton d'ajout rapide */}
      <button 
        className="fab"
        onClick={() => navigate('/add-transaction')}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
