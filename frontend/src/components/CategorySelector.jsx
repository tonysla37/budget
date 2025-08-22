import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categoryService';
import { COLORS } from '../utils/colors';
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
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleSelectCategory = (category) => {
    onSelectCategory(category.id);
    setShowModal(false);
  };

  return (
    <div className="category-selector">
      <label className="input-label">Catégorie</label>
      <button
        className="category-selector-button"
        onClick={() => setShowModal(true)}
      >
        {selectedCategory ? (
          <div className="selected-category">
            <div className="category-color" style={{ backgroundColor: selectedCategory.color }} />
            <span className="selected-category-text">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="placeholder">Sélectionner une catégorie</span>
        )}
        <ChevronDown size={20} />
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Sélectionner une catégorie</h3>
              <button 
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-item"
                  onClick={() => handleSelectCategory(category)}
                >
                  <div className="category-info">
                    <div className="category-color" style={{ backgroundColor: category.color }} />
                    <span className="category-name">{category.name}</span>
                  </div>
                  {selectedCategoryId === category.id && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
