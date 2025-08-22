// Palette de couleurs pour les catégories
export const CATEGORY_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#d35400',
  '#8e44ad', '#27ae60', '#2980b9', '#f1c40f', '#e91e63',
  '#ff5722', '#795548', '#607d8b', '#3f51b5', '#2196f3'
];

// Couleurs de l'application
export const COLORS = {
  primary: '#3498db',
  secondary: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  gray: {
    100: '#f8f9fa',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  success: '#28a745',
  error: '#dc3545',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    disabled: '#bdc3c7',
  },
  border: '#dee2e6',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Obtenir une couleur aléatoire pour les catégories
export const getRandomColor = () => {
  return CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
};

// Obtenir une couleur basée sur un index
export const getColorByIndex = (index) => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

// Obtenir une couleur basée sur une chaîne (pour la cohérence)
export const getColorByString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};
