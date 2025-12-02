import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { useTranslation } from '../i18n';

const CategoriesScreen = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    parent_id: null
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
      alert(t('categories.saveError'));
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type || 'expense',
      color: category.color,
      parent_id: category.parent_id || null
    });
    setCustomColor(category.color);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('categories.deleteConfirm'))) {
      try {
        await deleteCategory(id);
        await loadCategories();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert(t('categories.deleteError'));
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      parent_id: null
    });
    setCustomColor('#3b82f6');
  };

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddSubcategory = (parentCategory) => {
    setFormData({
      name: '',
      type: parentCategory.type,
      color: parentCategory.color,
      parent_id: parentCategory.id
    });
    setCustomColor(parentCategory.color);
    setShowModal(true);
  };

  // Organiser les catégories en structure hiérarchique
  const organizeCategories = () => {
    const parents = categories.filter(cat => !cat.parent_id);
    const subcategories = categories.filter(cat => cat.parent_id);
    
    return parents.map(parent => ({
      ...parent,
      subcategories: subcategories.filter(sub => sub.parent_id === parent.id)
    }));
  };

  const hierarchicalCategories = organizeCategories();

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
          <p className="text-gray-600">{t('categories.loading')}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{t('categories.title')}</h1>
              <p className="text-gray-600 mt-1">
                {categories.length} {categories.length !== 1 ? t('categories.categoryCountPlural') : t('categories.categoryCount')}
              </p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('common.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {hierarchicalCategories.map(category => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Catégorie parente */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center flex-1">
                    {category.subcategories.length > 0 && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="mr-2 p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{category.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          category.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.type === 'income' ? t('categories.typeIncome') : t('categories.typeExpense')}
                        </span>
                        {category.subcategories.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {category.subcategories.length} {t('categories.subcategories')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleAddSubcategory(category)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={t('categories.addSubcategory')}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sous-catégories */}
              {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {category.subcategories.map(subcategory => (
                      <div key={subcategory.id} className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center flex-1">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: subcategory.color }}
                            ></div>
                            <h4 className="text-sm font-medium text-gray-900">{subcategory.name}</h4>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button 
                            onClick={() => handleEdit(subcategory)}
                            className="flex-1 p-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="h-3 w-3 mx-auto" />
                          </button>
                          <button 
                            onClick={() => handleDelete(subcategory.id)}
                            className="flex-1 p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mx-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">{t('categories.title')}</p>
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('categories.add')}
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
                {editingCategory ? t('categories.modalTitleEdit') : t('categories.modalTitle')}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('categories.nameLabel')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('categories.namePlaceholder')}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('categories.typeLabel')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={formData.parent_id}
                >
                  <option value="expense">{t('categories.typeExpense')}</option>
                  <option value="income">{t('categories.typeIncome')}</option>
                </select>
                {formData.parent_id && (
                  <p className="text-xs text-gray-500 mt-1">{t('categories.typeInherited')}</p>
                )}
              </div>

              {!editingCategory && !formData.parent_id && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('categories.parentLabel')}
                  </label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => {
                      const parentId = e.target.value || null;
                      const parentCat = categories.find(c => c.id === parentId);
                      setFormData({
                        ...formData, 
                        parent_id: parentId,
                        type: parentCat ? parentCat.type : formData.type,
                        color: parentCat ? parentCat.color : formData.color
                      });
                      if (parentCat) {
                        setCustomColor(parentCat.color);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('categories.parentNone')}</option>
                    {categories.filter(cat => !cat.parent_id && cat.type === formData.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('categories.subcategoryHint')}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('categories.colorLabel')}</label>
                
                {/* Sélecteur de couleur personnalisée */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-2">{t('categories.customColor')}</label>
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
                  <label className="block text-xs font-medium text-gray-600 mb-2">{t('categories.predefinedColors')}</label>
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
                  {t('categories.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingCategory ? t('categories.edit') : t('categories.save')}
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
