// Validation d'email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation de mot de passe
export const isValidPassword = (password) => {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validation de montant
export const isValidAmount = (amount) => {
  if (!amount || amount === '') {
    return false;
  }
  
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

// Validation de description
export const isValidDescription = (description) => {
  return description && description.trim().length >= 2 && description.trim().length <= 100;
};

// Validation de nom de catégorie
export const isValidCategoryName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Validation de date
export const isValidDate = (date) => {
  if (!date) {
    return false;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

// Validation de date future
export const isFutureDate = (date) => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj > today;
};

// Validation de date passée
export const isPastDate = (date) => {
  if (!isValidDate(date)) {
    return false;
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return dateObj <= today;
};
