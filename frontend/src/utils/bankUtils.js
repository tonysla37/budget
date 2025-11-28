/**
 * Utilitaires pour la gestion des banques
 */

// Couleurs des banques (Tailwind CSS classes)
export const BANK_COLORS = {
  boursobank: {
    border: 'border-pink-500',
    text: 'text-pink-700',
    bg: 'bg-pink-50',
    bgSolid: 'bg-pink-100',
    badge: 'bg-pink-100 text-pink-700'  // Style du badge comme dans BankConnectionsScreen
  },
  cic: {
    border: 'border-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    bgSolid: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-700'
  },
  other: {
    border: 'border-gray-400',
    text: 'text-gray-700',
    bg: 'bg-gray-50',
    bgSolid: 'bg-gray-100',
    badge: 'bg-gray-100 text-gray-700'
  }
};

/**
 * Récupère les classes CSS pour une banque donnée
 * @param {string} bankName - Nom de la banque ('boursobank', 'cic', etc.)
 * @returns {object} - Objet contenant les classes CSS
 */
export const getBankStyles = (bankName) => {
  const normalized = bankName?.toLowerCase();
  return BANK_COLORS[normalized] || BANK_COLORS.other;
};

/**
 * Récupère le nom affiché pour une banque
 * @param {string} bankId - ID de la banque
 * @returns {string} - Nom affiché
 */
export const getBankDisplayName = (bankId) => {
  const names = {
    boursobank: 'BoursoBank',
    cic: 'CIC',
    other: 'Autre'
  };
  return names[bankId?.toLowerCase()] || bankId || 'Autre';
};

/**
 * Récupère l'icône pour une banque
 * @param {string} bankId - ID de la banque
 * @returns {string} - Emoji de la banque
 */
export const getBankIcon = (bankId) => {
  const icons = {
    boursobank: '🏦',
    cic: '🏦',
    other: '💳'
  };
  return icons[bankId?.toLowerCase()] || '💳';
};
