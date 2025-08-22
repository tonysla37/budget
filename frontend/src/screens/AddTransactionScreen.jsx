import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction } from '../services/transactionService';
import { COLORS } from '../utils/colors';
import { formatDate } from '../utils/formatters';
import CategorySelector from '../components/CategorySelector';
import { Plus, Minus, Calendar, ArrowLeft } from 'lucide-react';

export default function AddTransactionScreen() {
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigate = useNavigate();

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!description.trim() || !amount.trim() || !categoryId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setIsLoading(true);
    try {
      await createTransaction({
        description: description.trim(),
        amount: numAmount,
        date: date.toISOString().split('T')[0],
        category_id: categoryId,
        is_expense: type === 'expense',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Impossible de créer la transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-transaction-container">
      {/* Header */}
      <div className="add-transaction-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="add-transaction-title">Nouvelle transaction</h1>
      </div>

      <div className="add-transaction-content">
        {/* Sélecteur de type */}
        <div className="type-selector">
          <button
            className={`type-button ${type === 'expense' ? 'selected' : ''}`}
            onClick={() => setType('expense')}
          >
            <Minus size={20} />
            <span className="type-button-text">Dépense</span>
          </button>
          
          <button
            className={`type-button ${type === 'income' ? 'selected' : ''}`}
            onClick={() => setType('income')}
          >
            <Plus size={20} />
            <span className="type-button-text">Revenu</span>
          </button>
        </div>

        <div className="form">
          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Courses alimentaires"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Montant */}
          <div className="input-group">
            <label className="input-label">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              maxLength={10}
            />
          </div>

          {/* Date */}
          <div className="input-group">
            <label className="input-label">Date</label>
            <button
              className="date-button"
              onClick={showDatePickerModal}
            >
              <Calendar size={20} />
              <span className="date-button-text">{formatDate(date, 'short')}</span>
            </button>
            {showDatePicker && (
              <input
                type="date"
                value={date.toISOString().split('T')[0]}
                onChange={onDateChange}
                className="date-input"
                max={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          {/* Sélecteur de catégorie */}
          <CategorySelector 
            selectedCategoryId={categoryId}
            onSelectCategory={setCategoryId}
            type={type}
          />
        </div>

        {/* Bouton de soumission */}
        <button
          className={`submit-button ${isLoading ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Création...' : 'Créer la transaction'}
        </button>
      </div>
    </div>
  );
}
