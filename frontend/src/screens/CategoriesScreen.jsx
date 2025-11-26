import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(true);
  const [customColor, setCustomColor] = useState('#3b82f6');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      console.log('Categories loaded:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Mise à jour
        await updateCategory(editingCategory.id, formData);
      } else {
        // Ajout
        await createCategory(formData);
      }
      
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Impossible de sauvegarder la catégorie');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type || 'expense',
      color: category.color
    });
    setCustomColor(category.color);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Impossible de supprimer la catégorie');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: '#3b82f6'
    });
    setCustomColor('#3b82f6');
  };

  const colorOptions = [
    // Rouges
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#f87171', '#fca5a5',
    // Oranges
    '#f97316', '#ea580c', '#c2410c', '#fb923c', '#fdba74', '#ff8c00',
    // Jaunes
    '#eab308', '#ca8a04', '#a16207', '#fbbf24', '#fcd34d', '#fde047',
    // Verts
    '#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac', '#10b981',
    // Cyans/Teals
    '#14b8a6', '#0d9488', '#0f766e', '#2dd4bf', '#5eead4', '#06b6d4',
    // Bleus
    '#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd', '#0ea5e9',
    // Indigos
    '#6366f1', '#4f46e5', '#4338ca', '#818cf8', '#a5b4fc', '#5b21b6',
    // Violets
    '#a855f7', '#9333ea', '#7e22ce', '#c084fc', '#d8b4fe', '#8b5cf6',
    // Roses
    '#ec4899', '#db2777', '#be185d', '#f472b6', '#f9a8d4', '#e11d48',
    // Marrons/Beiges
    '#92400e', '#78350f', '#d97706', '#b45309', '#a3a3a3', '#737373',
    // Gris
    '#6b7280', '#4b5563', '#374151', '#9ca3af', '#d1d5db', '#1f2937'
  ];

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    setFormData({...formData, color});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
              <p className="text-gray-600 mt-1">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                      category.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.type === 'income' ? 'Revenu' : 'Dépense'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 text-sm text-gray-600">
                <p>{category.transaction_count || 0} transaction{(category.transaction_count || 0) !== 1 ? 's' : ''}</p>
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleEdit(category)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Modifier</span>
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">Aucune catégorie</p>
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter votre première catégorie
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Modifier' : 'Ajouter'} une catégorie
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de la catégorie"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                
                {/* Sélecteur de couleur personnalisée */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Couleur personnalisée</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            setFormData({...formData, color: e.target.value});
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="#000000"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                </div>

                {/* Palette prédéfinie */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Couleurs prédéfinies</label>
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-10 h-10 rounded-lg transition-all ${
                          formData.color === color 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setFormData({...formData, color});
                          setCustomColor(color);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingCategory ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesScreen;
