import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categoryService';
import { ChevronDown, Check } from 'lucide-react';

export default function CategorySelector({ selectedCategoryId, onSelectCategory, type = 'expense' }) {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [type]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories(type);
      console.log('Catégories chargées:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleSelectCategory = (category) => {
    console.log('Catégorie sélectionnée:', category);
    onSelectCategory(category.id);
    setShowModal(false);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
      <button
        type="button"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        onClick={() => setShowModal(true)}
      >
        {selectedCategory ? (
          <div className="flex items-center">
            <div 
              className="w-6 h-6 rounded-full mr-3" 
              style={{ backgroundColor: selectedCategory.color || '#6366f1' }} 
            />
            <span className="text-gray-900">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Sélectionner une catégorie</span>
        )}
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sélectionner une catégorie</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucune catégorie disponible</div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedCategoryId === category.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectCategory(category)}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-3" 
                          style={{ backgroundColor: category.color || '#6366f1' }} 
                        />
                        <span className="text-gray-900">{category.name}</span>
                      </div>
                      {selectedCategoryId === category.id && (
                        <Check size={20} className="text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
