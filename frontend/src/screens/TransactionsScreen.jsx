import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTransactions, deleteTransaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { COLORS } from '../utils/colors';
import { Plus, Filter, Edit, Trash2, Search } from 'lucide-react';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadTransactions();
  }, [selectedPeriod, selectedCategory]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions({
        period: selectedPeriod,
        category_id: selectedCategory === 'all' ? null : selectedCategory,
        search: searchTerm
      });
      setTransactions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TransactionItem = ({ item }) => (
    <div className="transaction-item">
      <div className="transaction-header">
        <div className="transaction-info">
          <span className="transaction-description">{item.description}</span>
          <span className="transaction-category">{item.category_name}</span>
        </div>
        <div className="transaction-amount">
          <span className={`transaction-value ${item.is_expense ? 'expense' : 'income'}`}>
            {item.is_expense ? '-' : '+'}{formatCurrency(item.amount)}
          </span>
          <span className="transaction-date">{formatDate(item.date)}</span>
        </div>
      </div>
      
      <div className="transaction-actions">
        <button
          className="action-button"
          onClick={() => navigate('/edit-transaction', { state: { transaction: item } })}
        >
          <Edit size={16} color="#3498db" />
          <span className="action-text">Modifier</span>
        </button>
        
        <button
          className="action-button"
          onClick={() => handleDeleteTransaction(item.id)}
        >
          <Trash2 size={16} color="#e74c3c" />
          <span className="action-text delete-text">Supprimer</span>
        </button>
      </div>
    </div>
  );

  const FilterModal = () => (
    <div className={`modal-overlay ${showFilters ? 'show' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Filtres</h3>
          <button 
            className="close-button"
            onClick={() => setShowFilters(false)}
          >
            ×
          </button>
        </div>

        <div className="filter-section">
          <label className="filter-label">Période</label>
          <div className="filter-options">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'current', label: 'Ce mois' },
              { key: 'last', label: 'Mois dernier' },
              { key: 'thisYear', label: 'Cette année' },
            ].map(period => (
              <button
                key={period.key}
                className={`filter-option ${selectedPeriod === period.key ? 'selected' : ''}`}
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">Catégorie</label>
          <div className="filter-options">
            <button
              className={`filter-option ${selectedCategory === 'all' ? 'selected' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Toutes
            </button>
            {/* Ajouter les catégories ici */}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="transactions-container">
        <div className="loading-text">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      {/* Header */}
      <div className="transactions-header">
        <h1 className="transactions-title">Transactions</h1>
        <div className="header-actions">
          <button 
            className="filter-button"
            onClick={() => setShowFilters(true)}
          >
            <Filter size={20} />
          </button>
          <button 
            className="add-button"
            onClick={() => navigate('/add-transaction')}
          >
            <Plus size={20} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher des transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>Aucune transaction trouvée</p>
            <button 
              className="add-first-button"
              onClick={() => navigate('/add-transaction')}
            >
              Ajouter votre première transaction
            </button>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} item={transaction} />
          ))
        )}
      </div>

      <FilterModal />
    </div>
  );
}
