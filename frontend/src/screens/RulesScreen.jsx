import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categoryService';
import { getRules, createRule, updateRule, deleteRule } from '../services/ruleService';
import { Filter, Plus, Trash2, Edit, Save, X, CheckCircle, RotateCcw, Power } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function RulesScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [exceptionInput, setExceptionInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    pattern: '',
    match_type: 'contains', // contains, starts_with, ends_with, exact
    category_id: '',
    is_active: true,
    exceptions: [],
    start_date: null,
    end_date: null
  });

  useEffect(() => {
    loadCategories();
    loadRules();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadRules = async () => {
    try {
      const data = await getRules();
      setRules(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des règles:', error);
      setRules([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Nettoyer les données avant l'envoi (convertir les chaînes vides en null)
      const cleanedData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingRule) {
        await updateRule(editingRule.id, cleanedData);
      } else {
        await createRule(cleanedData);
      }
      
      setShowModal(false);
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la règle:', error);
      alert('Erreur lors de la sauvegarde de la règle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        await deleteRule(id);
        loadRules();
      } catch (error) {
        console.error('Erreur lors de la suppression de la règle:', error);
        alert('Erreur lors de la suppression de la règle');
      }
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      pattern: rule.pattern,
      match_type: rule.match_type,
      category_id: rule.category_id,
      is_active: rule.is_active,
      exceptions: rule.exceptions || [],
      start_date: rule.start_date || null,
      end_date: rule.end_date || null
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pattern: '',
      match_type: 'contains',
      category_id: '',
      is_active: true,
      exceptions: [],
      start_date: null,
      end_date: null
    });
    setEditingRule(null);
    setExceptionInput('');
  };

  const addException = () => {
    if (exceptionInput.trim()) {
      setFormData({
        ...formData,
        exceptions: [...formData.exceptions, exceptionInput.trim()]
      });
      setExceptionInput('');
    }
  };

  const removeException = (index) => {
    setFormData({
      ...formData,
      exceptions: formData.exceptions.filter((_, i) => i !== index)
    });
  };

  const resetPeriod = () => {
    setFormData({
      ...formData,
      start_date: null,
      end_date: null
    });
  };

  const toggleRuleActive = async (rule) => {
    try {
      await updateRule(rule.id, {
        is_active: !rule.is_active
      });
      loadRules();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.name} › ${category.name}` : category.name;
    }
    
    return category.name;
  };

  const getMatchTypeLabel = (type) => {
    const labels = {
      contains: 'Contient',
      starts_with: 'Commence par',
      ends_with: 'Finit par',
      exact: 'Exactement'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Règles de catégorisation</h1>
              <p className="text-gray-600 mt-1">
                Automatisez l'assignation des catégories pour vos transactions
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Filter className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Comment ça fonctionne ?</h3>
              <p className="text-sm text-blue-800 mt-1">
                Les règles sont appliquées automatiquement lors de l'import des transactions bancaires.
                Si le libellé d'une transaction correspond au motif défini, la catégorie sera assignée automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* Rules List */}
        {rules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune règle définie
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre première règle pour automatiser la catégorisation de vos transactions
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer une règle
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom de la règle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      {rule.exceptions && rule.exceptions.length > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          {rule.exceptions.length} exception(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-800">
                        {rule.pattern}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-600">
                        {getMatchTypeLabel(rule.match_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rule.category_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.start_date || rule.end_date ? (
                        <div className="text-xs text-gray-600">
                          {rule.start_date && (
                            <div>À partir du {new Date(rule.start_date).toLocaleDateString('fr-FR')}</div>
                          )}
                          {rule.end_date && (
                            <div>Jusqu'au {new Date(rule.end_date).toLocaleDateString('fr-FR')}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Toujours</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleRuleActive(rule)}
                        className={`mr-3 ${
                          rule.is_active 
                            ? 'text-green-600 hover:text-green-900' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={rule.is_active ? 'Désactiver la règle' : 'Activer la règle'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom de la règle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Courses Carrefour"
                  required
                />
              </div>

              {/* Type de correspondance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de correspondance
                </label>
                <select
                  value={formData.match_type}
                  onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="contains">Contient</option>
                  <option value="starts_with">Commence par</option>
                  <option value="ends_with">Finit par</option>
                  <option value="exact">Exactement</option>
                </select>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de recherche
                </label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: CARREFOUR"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le texte à rechercher dans le libellé de la transaction (insensible à la casse)
                </p>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie à assigner
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
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

              {/* Exceptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exceptions (motifs à exclure)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={exceptionInput}
                    onChange={(e) => setExceptionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addException();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: CARREFOUR CONTACT"
                  />
                  <button
                    type="button"
                    onClick={addException}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {formData.exceptions.length > 0 && (
                  <div className="space-y-1">
                    {formData.exceptions.map((exception, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <code className="text-xs text-gray-800">{exception}</code>
                        <button
                          type="button"
                          onClick={() => removeException(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Si le libellé contient une de ces exceptions, la règle ne s'appliquera pas
                </p>
              </div>

              {/* Période d'application */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Période d'application
                  </label>
                  {(formData.start_date || formData.end_date) && (
                    <button
                      type="button"
                      onClick={resetPeriod}
                      className="flex items-center text-xs text-gray-600 hover:text-gray-800"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Réinitialiser
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Date de début (optionnel)
                    </label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Date de fin (optionnel)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La règle s'appliquera uniquement aux transactions dans cette période
                </p>
              </div>

              {/* Statut */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Règle active
                </label>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingRule ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
