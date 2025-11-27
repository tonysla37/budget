import React, { useState, useEffect } from 'react';
import { getMonthlyReports } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Calendar, PiggyBank, BarChart3, LineChart } from 'lucide-react';
import { useTranslation } from '../i18n';
import LineChartComponent from '../components/LineChart';
import BarChartComponent from '../components/BarChart';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('net'); // 'net', 'expenses', 'income', 'savings'
  const [chartType, setChartType] = useState('line'); // 'line' ou 'bar'

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
      
      // Calculer l'épargne cumulative (solde du compte qui s'accumule)
      // TODO: Récupérer le solde initial depuis Boursorama API
      // Pour l'instant, on commence à 0 et on accumule les soldes mensuels
      let cumulativeSavings = 0;
      monthsData.forEach(report => {
        cumulativeSavings += report.net;
        report.cumulative_savings = cumulativeSavings;
      });
      
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
        return report.cumulative_savings || 0;
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
    // L'épargne totale = le solde cumulé du dernier mois
    const totalSavings = reports[reports.length - 1]?.cumulative_savings || 0;
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('reports.monthlyEvolution')}</h2>
              
              {/* Sélecteur de type de graphique */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    chartType === 'line'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LineChart size={16} />
                  Courbe
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    chartType === 'bar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 size={16} />
                  Barres
                </button>
              </div>
            </div>
            
            {/* Sélecteur de métrique (uniquement pour graphique en ligne) */}
            {chartType === 'line' && (
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
            )}
          </div>

          {/* Graphiques */}
          <div className="mt-6">
            {chartType === 'line' ? (
              <LineChartComponent
                data={reports.map(r => ({
                  label: r.label,
                  value: getMetricValue(r)
                }))}
                width={1000}
                height={350}
                color={
                  selectedMetric === 'income' ? '#10b981' :
                  selectedMetric === 'expenses' ? '#ef4444' :
                  selectedMetric === 'savings' ? '#3b82f6' :
                  '#8b5cf6'
                }
              />
            ) : (
              <BarChartComponent
                data={reports.map(r => ({
                  label: r.label,
                  income: r.total_income,
                  expenses: r.total_expenses
                }))}
                width={1000}
                height={350}
              />
            )}
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
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('reports.monthlyNetColumn')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-blue-700 bg-blue-50">{t('reports.cumulativeBalanceColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const monthlyNet = report.net;
                  const cumulativeSavings = report.cumulative_savings || 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{report.label}</td>
                      <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                        {formatCurrency(report.total_income)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-red-600 font-semibold">
                        {formatCurrency(report.total_expenses)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(monthlyNet)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-bold bg-blue-50 ${cumulativeSavings >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {formatCurrency(cumulativeSavings)}
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
