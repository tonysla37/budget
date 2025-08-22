import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#e53e3e'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Simulation de données
      const mockCategories = [
        { id: 1, name: 'Alimentation', type: 'expense', color: '#e53e3e', transaction_count: 15 },
        { id: 2, name: 'Transport', type: 'expense', color: '#3182ce', transaction_count: 8 },
        { id: 3, name: 'Loisirs', type: 'expense', color: '#805ad5', transaction_count: 12 },
        { id: 4, name: 'Salaire', type: 'income', color: '#38a169', transaction_count: 3 },
        { id: 5, name: 'Travail', type: 'income', color: '#d69e2e', transaction_count: 5 }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Mise à jour
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...formData }
            : cat
        ));
      } else {
        // Ajout
        const newCategory = {
          id: Date.now(),
          ...formData,
          transaction_count: 0
        };
        setCategories([...categories, newCategory]);
      }
      
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        setCategories(categories.filter(cat => cat.id !== id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: '#e53e3e'
    });
  };

  const colorOptions = [
    '#e53e3e', '#3182ce', '#805ad5', '#38a169', '#d69e2e',
    '#dd6b20', '#319795', '#d53f8c', '#2d3748', '#4a5568'
  ];

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="container">
      <div className="screen-header">
        <h1>Catégories</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <div 
                className="category-color" 
                style={{ backgroundColor: category.color }}
              ></div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <span className={`category-type ${category.type}`}>
                  {category.type === 'income' ? 'Revenu' : 'Dépense'}
                </span>
              </div>
            </div>
            
            <div className="category-stats">
              <p>{category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="category-actions">
              <button 
                className="btn btn-secondary action-btn"
                onClick={() => handleEdit(category)}
              >
                <Edit size={14} />
              </button>
              <button 
                className="btn btn-danger action-btn"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Modifier' : 'Ajouter'} une catégorie</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="Nom de la catégorie"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="form-select"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Couleur</label>
                <div className="color-picker">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
