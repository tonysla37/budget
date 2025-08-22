// Formatage des montants en euros
export const formatCurrency = (amount, currency = 'EUR') => {
  if (amount === null || amount === undefined) {
    return '0,00 €';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0,00 €';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Formatage des pourcentages
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) {
    return '0%';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }

  return `${numValue.toFixed(decimals)}%`;
};

// Formatage des nombres
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) {
    return '0';
  }

  const numValue = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

// Formatage des dates
export const formatDate = (date, format = 'short') => {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const options = {
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    long: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    month: {
      month: 'long',
      year: 'numeric',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
    },
    datetime: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return new Intl.DateTimeFormat('fr-FR', options[format] || options.short).format(dateObj);
};

// Formatage des noms de catégories
export const formatCategoryName = (name, maxLength = 20) => {
  if (!name) {
    return '';
  }

  if (name.length <= maxLength) {
    return name;
  }

  return name.substring(0, maxLength - 3) + '...';
};

// Formatage des descriptions de transactions
export const formatDescription = (description, maxLength = 30) => {
  if (!description) {
    return '';
  }

  if (description.length <= maxLength) {
    return description;
  }

  return description.substring(0, maxLength - 3) + '...';
};

// Formatage des montants pour l'affichage (avec couleur selon le type)
export const formatAmountWithColor = (amount, type = 'expense') => {
  const formattedAmount = formatCurrency(Math.abs(amount));
  
  if (type === 'income') {
    return { text: `+${formattedAmount}`, color: '#27ae60' };
  } else {
    return { text: `-${formattedAmount}`, color: '#e74c3c' };
  }
};

// Formatage des statistiques
export const formatStatistic = (value, type = 'currency') => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    default:
      return value?.toString() || '0';
  }
};
