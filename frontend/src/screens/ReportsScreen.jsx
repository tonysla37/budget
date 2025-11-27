import React, { useState, useEffect } from 'react';
import { getMonthlyReports } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Calendar, PiggyBank, BarChart3, LineChart } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('net'); // 'net', 'expenses', 'income', 'savings'

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      // Charger les 6 derniers mois
      const now = new Date();
      const monthsData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        try {
          const data = await getMonthlyReports(year, month);
          console.log(`Données pour ${year}-${month}:`, data);
          monthsData.push({
            year,
            month,
            label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            total_income: data.total_income || 0,
            total_expenses: data.total_expenses || 0,
            net: data.net || 0
          });
        } catch (error) {
          console.error(`Erreur pour ${year}-${month}:`, error);
          // Ajouter des données vides en cas d'erreur
          monthsData.push({
            year,
            month,
            label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            total_income: 0,
            total_expenses: 0,
            net: 0
          });
        }
      }
      
      console.log('Tous les rapports chargés:', monthsData);
      setReports(monthsData);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricValue = (report) => {
    switch (selectedMetric) {
      case 'income':
        return report.total_income;
      case 'expenses':
        return report.total_expenses;
      case 'net':
        return report.net;
      case 'savings':
        return report.total_income - report.total_expenses;
      default:
        return 0;
    }
  };

  const getMetricColor = (value) => {
    if (selectedMetric === 'expenses') return 'red';
    if (selectedMetric === 'income') return 'green';
    return value >= 0 ? 'green' : 'red';
  };

  const calculateStats = () => {
    if (reports.length === 0) return null;

    const totalIncome = reports.reduce((sum, r) => sum + r.total_income, 0);
    const totalExpenses = reports.reduce((sum, r) => sum + r.total_expenses, 0);
    const totalSavings = totalIncome - totalExpenses;
    const avgIncome = totalIncome / reports.length;
    const avgExpenses = totalExpenses / reports.length;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome * 100) : 0;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      avgIncome,
      avgExpenses,
      savingsRate
    };
  };

  const stats = calculateStats();

  // Calcul du graphique en barres simplifié
  const maxValue = Math.max(...reports.map(r => Math.max(r.total_income, r.total_expenses)));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('reports.loading')}</p>
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('reports.noData')}</h2>
          <p className="text-gray-500">{t('reports.noDataSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
                <p className="text-sm text-gray-600">{t('reports.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cartes statistiques globales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Revenus totaux */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t('reports.totalIncomeLabel')}</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalIncome)}</div>
              <div className="text-sm text-gray-500 mt-1">
                {t('reports.avgMonthlyShort')} : {formatCurrency(stats.avgIncome)}{t('reports.perMonth')}
              </div>
            </div>

            {/* Dépenses totales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t('reports.totalExpensesLabel')}</span>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</div>
              <div className="text-sm text-gray-500 mt-1">
                {t('reports.avgMonthly')} {formatCurrency(stats.avgExpenses)}{t('reports.perMonth')}
              </div>
            </div>

            {/* Économies */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t('reports.savingsLabel')}</span>
                <PiggyBank className="h-5 w-5 text-blue-600" />
              </div>
              <div className={`text-3xl font-bold ${stats.totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalSavings)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {t('reports.savingsRateLabel')} {stats.savingsRate.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Graphique d'évolution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('reports.monthlyEvolution')}</h2>
            
            {/* Sélecteur de métrique */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedMetric('income')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'income'
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('reports.metricIncome')}
              </button>
              <button
                onClick={() => setSelectedMetric('expenses')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'expenses'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('reports.metricExpenses')}
              </button>
              <button
                onClick={() => setSelectedMetric('savings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'savings'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('reports.metricSavings')}
              </button>
              <button
                onClick={() => setSelectedMetric('net')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'net'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('reports.metricNet')}
              </button>
            </div>
          </div>

          {/* Graphique en barres */}
          <div className="space-y-4">
            {reports.map((report, index) => {
              const value = getMetricValue(report);
              const percentage = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
              const color = getMetricColor(value);
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-24">{report.label}</span>
                    <span className={`font-bold ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(Math.abs(value))}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3 ${
                        color === 'green' ? 'bg-green-500' :
                        color === 'red' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détails mensuels */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('reports.detailsByMonth')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.monthColumn')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.incomeColumn')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.expensesColumn')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.savingsColumn')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.savingsRateColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const savings = report.total_income - report.total_expenses;
                  const savingsRate = report.total_income > 0 ? (savings / report.total_income * 100) : 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{report.label}</td>
                      <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                        {formatCurrency(report.total_income)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-red-600 font-semibold">
                        {formatCurrency(report.total_expenses)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(savings)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">
                        {savingsRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
