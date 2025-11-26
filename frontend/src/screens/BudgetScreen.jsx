import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { formatCurrency } from '../utils/formatters';
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
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
      const [budgetsData, categoriesData] = await Promise.all([
        getBudgets(periodType),
        getCategories()
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData.filter(cat => cat.type === 'expense'));
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
      alert(error.message || 'Une erreur est survenue');
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) return;
    try {
      await deleteBudget(budgetId);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getBudgetStatus = (percentage) => {
    if (percentage >= 100) return { color: 'red', icon: AlertTriangle, text: 'Dépassé' };
    if (percentage >= 80) return { color: 'orange', icon: AlertCircle, text: 'Attention' };
    return { color: 'green', icon: CheckCircle2, text: 'OK' };
  };

  const BudgetCard = ({ budget }) => {
    const status = getBudgetStatus(budget.percentage);
    const StatusIcon = status.icon;
    const progressWidth = Math.min(budget.percentage, 100);

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
            <span className="text-gray-600">Budget alloué</span>
            <span className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dépensé</span>
            <span className={`font-semibold ${budget.percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(budget.spent)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Restant</span>
            <span className={`font-semibold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(budget.remaining))}
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
                  {status.text}
                </span>
              </div>
              <span className={`text-sm font-bold ${budget.percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {budget.percentage.toFixed(1)}%
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
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des budgets...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
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
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
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
                Nouveau budget
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
              Créer mon premier budget
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
              {editingBudget ? 'Modifier le budget' : 'Nouveau budget'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
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
                  Montant du budget (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="500.00"
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
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBudget ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
