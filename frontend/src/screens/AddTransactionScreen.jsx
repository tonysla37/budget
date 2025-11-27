import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction } from '../services/transactionService';
import { formatDate } from '../utils/formatters';
import CategorySelector from '../components/CategorySelector';
import { Plus, Minus, Calendar, ArrowLeft } from 'lucide-react';
import { t } from '../i18n';

export default function AddTransactionScreen() {
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim() || !amount.trim() || !categoryId) {
      alert(t('addTransaction.errorRequired'));
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t('addTransaction.errorAmount'));
      return;
    }

    setIsLoading(true);
    try {
      await createTransaction({
        description: description.trim(),
        amount: numAmount,
        date: date,
        merchant: merchant.trim() || undefined,
        category_id: categoryId,
        is_expense: type === 'expense',
      });
      
      navigate('/transactions');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert(t('addTransaction.errorCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('addTransaction.title')}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            {/* Sélecteur de type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addTransaction.typeLabel')}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`flex items-center justify-center p-4 border-2 rounded-lg transition-all ${
                    type === 'expense' 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => setType('expense')}
                >
                  <Minus size={20} className="mr-2" />
                  <span className="font-medium">{t('addTransaction.typeExpense')}</span>
                </button>
                
                <button
                  type="button"
                  className={`flex items-center justify-center p-4 border-2 rounded-lg transition-all ${
                    type === 'income' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => setType('income')}
                >
                  <Plus size={20} className="mr-2" />
                  <span className="font-medium">{t('addTransaction.typeIncome')}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addTransaction.descriptionLabel')}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('addTransaction.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Commerçant */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addTransaction.merchantLabel')}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('addTransaction.merchantPlaceholder')}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Montant */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addTransaction.amountLabel')}</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('addTransaction.amountPlaceholder')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addTransaction.dateLabel')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Sélecteur de catégorie */}
            <CategorySelector 
              selectedCategoryId={categoryId}
              onSelectCategory={setCategoryId}
              type={type}
            />

            {/* Boutons d'action */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('addTransaction.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? t('addTransaction.creating') : t('addTransaction.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
