# Frontend - Application Budget

##  Vue d'ensemble

Le frontend de l'Application Budget est développé avec **React Native** et **Expo**, offrant une expérience utilisateur moderne et responsive sur mobile et web.

## 🛠️ Technologies utilisées

- **React Native** : 0.72.6
- **Expo** : 49.0.15
- **React Navigation** : 6.x
- **AsyncStorage** : Stockage local
- **Expo Vector Icons** : Icônes

## 📁 Structure du code

```
frontend/src/
├──  screens/           # Écrans de l'application
│   ├── LoginScreen.js    # Écran de connexion
│   ├── DashboardScreen.js # Tableau de bord
│   ├── TransactionsScreen.js # Liste des transactions
│   ├── AddTransactionScreen.js # Ajout de transaction
│   └── CategoriesScreen.js # Gestion des catégories
├──  services/          # Services API
│   ├── authService.js    # Authentification
│   ├── transactionService.js # Transactions
│   ├── categoryService.js # Catégories
│   └── dashboardService.js # Dashboard
├──  navigation/        # Navigation
│   └── AppNavigator.js   # Navigation principale
├──  contexts/          # Contexte React
│   └── AuthContext.js    # Contexte d'authentification
├──  utils/             # Utilitaires
│   ├── formatters.js     # Formatage des données
│   ├── dateUtils.js      # Utilitaires de dates
│   ├── validators.js     # Validation
│   └── colors.js         # Couleurs et thème
├──  config/            # Configuration
│   └── api.config.js     # Configuration API
└──  constants/         # Constantes
    └── theme.js          # Thème et couleurs
```

##  Design System

### Couleurs principales
```javascript
const COLORS = {
  primary: '#3498db',      // Bleu principal
  secondary: '#2ecc71',    // Vert
  danger: '#e74c3c',       // Rouge
  warning: '#f39c12',      // Orange
  success: '#27ae60',      // Vert succès
  background: '#f5f5f5',   // Fond gris clair
  surface: '#ffffff',      // Surface blanche
  text: {
    primary: '#2c3e50',    // Texte principal
    secondary: '#7f8c8d',  // Texte secondaire
  }
};
```

### Typographie
- **Titres** : 18-24px, font-weight: bold
- **Corps** : 14-16px, font-weight: normal
- **Captions** : 12px, font-weight: normal

### Espacement
- **Base** : 8px
- **Padding** : 15px
- **Margin** : 10px
- **Border radius** : 8px

##  Écrans détaillés

### 1. LoginScreen
**Fonctionnalités :**
- Formulaire de connexion
- Validation en temps réel
- Mode démo intégré
- Gestion des erreurs

**Composants :**
```javascript
// Éléments principaux
- TextInput (email, password)
- TouchableOpacity (bouton connexion)
- Alert (messages d'erreur)
- KeyboardAvoidingView
```

### 2. DashboardScreen
**Fonctionnalités :**
- Statistiques financières
- Graphiques des catégories
- Transactions récentes
- Actions rapides

**Composants :**
```javascript
// Éléments principaux
- StatCard (cartes de statistiques)
- CategoryCard (cartes de catégories)
- TransactionItem (éléments de transaction)
- FAB (bouton d'ajout flottant)
```

### 3. TransactionsScreen
**Fonctionnalités :**
- Liste des transactions
- Filtres avancés
- Recherche textuelle
- Actions (modifier/supprimer)

**Composants :**
```javascript
// Éléments principaux
- FlatList (liste des transactions)
- SearchBar (recherche)
- FilterModal (modal de filtres)
- TransactionItem (élément de transaction)
```

### 4. AddTransactionScreen
**Fonctionnalités :**
- Formulaire d'ajout
- Sélecteur de catégorie
- Sélecteur de date
- Validation en temps réel

**Composants :**
```javascript
// Éléments principaux
- TypeSelector (revenu/dépense)
- TextInput (description, montant)
- CategorySelector (sélecteur de catégorie)
- DateTimePicker (sélecteur de date)
```

### 5. CategoriesScreen
**Fonctionnalités :**
- Gestion des catégories
- Création/modification
- Sélecteur de couleurs
- Statistiques par catégorie

**Composants :**
```javascript
// Éléments principaux
- CategoryModal (modal d'édition)
- ColorPicker (sélecteur de couleurs)
- CategoryItem (élément de catégorie)
- StatsCard (statistiques)
```

## 🔧 Services API

### authService.js
```javascript
// Fonctions principales
- loginUser(email, password)
- logoutUser()
- isAuthenticated()
- getCurrentUser()
- refreshToken()
- registerUser(userData)
```

### transactionService.js
```javascript
// Fonctions principales
- getTransactions(filters)
- getTransaction(id)
- createTransaction(data)
- updateTransaction(id, data)
- deleteTransaction(id)
- getTransactionStats(period)
```

### categoryService.js
```javascript
// Fonctions principales
- getCategories()
- getCategory(id)
- createCategory(data)
- updateCategory(id, data)
- deleteCategory(id)
- getCategoryStats(id, period)
```

### dashboardService.js
```javascript
// Fonctions principales
- getDashboardData(period)
- getMonthlyDashboard(year, month)
- getCategoryDashboard(period)
- getTrends(period)
- getBudgetAlerts()
```

## 🧭 Navigation

### Structure de navigation
```
LoginScreen
└── MainTabs
    ├── DashboardScreen
    ├── TransactionsScreen
    └── CategoriesScreen
        └── AddTransactionScreen (modal)
```

### Configuration des onglets
```javascript
// Onglets principaux
- Dashboard (icône: home)
- Transactions (icône: list)
- Categories (icône: folder)
```

##  Authentification

### Flux d'authentification
1. **Connexion** : LoginScreen → validation → stockage token
2. **Vérification** : AuthContext vérifie le token au démarrage
3. **Persistance** : Token stocké dans AsyncStorage
4. **Renouvellement** : Refresh automatique du token

### Gestion des tokens
```javascript
// Stockage
await AsyncStorage.setItem('auth_token', token);

// Récupération
const token = await AsyncStorage.getItem('auth_token');

// Suppression
await AsyncStorage.removeItem('auth_token');
```

## 📊 Gestion d'état

### Contextes React
- **AuthContext** : État d'authentification global
- **UserContext** : Données utilisateur

### Hooks personnalisés
```javascript
// useAuth()
const { user, isLoggedIn, login, logout } = useAuth();

// useTransactions()
const { transactions, loading, error, refetch } = useTransactions();
```

##  Fonctionnalités avancées

### 1. Filtres et recherche
- **Recherche textuelle** : Description des transactions
- **Filtres par catégorie** : Sélection multiple
- **Filtres par période** : Mois, année, personnalisé
- **Filtres par type** : Revenus/dépenses

### 2. Validation des formulaires
```javascript
// Validation en temps réel
- Email : format valide
- Mot de passe : complexité
- Montant : nombre positif
- Description : longueur appropriée
```

### 3. Gestion des erreurs
- **Erreurs réseau** : Messages utilisateur
- **Erreurs de validation** : Feedback immédiat
- **Erreurs serveur** : Retry automatique

### 4. Performance
- **Lazy loading** : Chargement à la demande
- **Memoization** : Optimisation des re-renders
- **Debouncing** : Recherche optimisée

## 🧪 Tests

### Tests unitaires
```bash
# Lancer les tests
npm test

# Tests avec coverage
npm test -- --coverage
```

### Tests d'intégration
```bash
# Tests E2E avec Detox
npm run e2e
```

## 🚀 Déploiement

### Build de production
```bash
# Build Android
expo build:android

# Build iOS
expo build:ios

# Build web
expo build:web
```

### Configuration Expo
```javascript
// app.config.js
export default {
  expo: {
    name: "Budget App",
    slug: "budget-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};
```

##  Configuration

### Variables d'environnement
```javascript
// .env
API_URL=http://localhost:8000
ENVIRONMENT=development
```

### Configuration API
```javascript
// config/api.config.js
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
```

##  Compatibilité

### Plateformes supportées
- ✅ **Android** : API 21+ (Android 5.0+)
- ✅ **iOS** : iOS 11.0+
- ✅ **Web** : Navigateurs modernes
- ✅ **Expo Go** : Application de test

### Résolutions supportées
- **Mobile** : 320px - 428px de largeur
- **Tablette** : 768px - 1024px de largeur
- **Desktop** : 1024px+ de largeur

##  Personnalisation

### Thème personnalisé
```javascript
// constants/theme.js
export const CUSTOM_THEME = {
  colors: {
    primary: '#your-color',
    secondary: '#your-color',
  },
  fonts: {
    regular: 'Your-Font-Regular',
    bold: 'Your-Font-Bold',
  },
};
```

### Styles personnalisés
```javascript
// styles/customStyles.js
export const customStyles = StyleSheet.create({
  // Vos styles personnalisés
});
```

---

**Documentation frontend - Application Budget**
*Dernière mise à jour : $(date)*
```

Voulez-vous que je continue avec d'autres documents de documentation ou que je vérifie d'autres aspects du projet ?

### Fonctionnalités par écran

#### LoginScreen
- Formulaire de connexion
- Validation des champs
- Gestion des erreurs
- Mode démo intégré

#### DashboardScreen
- Statistiques financières
- Graphiques des catégories
- Transactions récentes
- Actions rapides

#### TransactionsScreen
- Liste des transactions
- Filtres avancés
- Recherche textuelle
- Actions (modifier/supprimer)

#### AddTransactionScreen
- Formulaire d'ajout
- Sélecteur de catégorie
- Sélecteur de date
- Validation en temps réel

#### CategoriesScreen
- Gestion des catégories
- Création/modification
- Sélecteur de couleurs
- Statistiques par catégorie

## 🧪 Tests et déploiement

### Scripts disponibles

#### Tests
```bash
# Test complet
./scripts/test_all.sh

# Tests individuels
./scripts/test_database.sh    # Test MongoDB
./scripts/test_backend.sh     # Test API
./scripts/test_frontend.sh    # Test React Native
```

#### Déploiement
```bash
# Déploiement complet
./scripts/deploy.sh

# Arrêt des services
./scripts/stop.sh

# Nettoyage complet
./scripts/purge.sh
```

### Logs et monitoring

#### Fichiers de logs
- `logs/test_database.log` - Tests de base de données
- `logs/test_backend.log` - Tests du backend
- `logs/test_frontend.log` - Tests du frontend
- `logs/test_all.log` - Tests d'ensemble
- `logs/deploy.log` - Logs de déploiement

#### Monitoring
```bash
# Vérifier l'état des services
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/db

# Vérifier les processus
ps aux | grep uvicorn
ps aux | grep expo
```

##  Dépannage

### Problèmes courants

#### 1. Backend ne démarre pas
**Symptômes** : Erreur de port déjà utilisé
```bash
# Solution
./scripts/stop.sh
./scripts/deploy.sh
```

#### 2. Frontend ne se connecte pas
**Symptômes** : "Non connecté" affiché
```bash
# Vérifier le backend
curl http://localhost:8000/api/health

# Vérifier CORS
# Voir backend/app/core/config.py
```

#### 3. MongoDB inaccessible
**Symptômes** : Erreur de connexion DB
```bash
# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl status mongod
```

#### 4. Dépendances manquantes
**Symptômes** : Erreurs d'import
```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install --legacy-peer-deps
```

#### 5. Ports occupés
**Symptômes** : "Address already in use"
```bash
# Nettoyer les processus
./scripts/stop.sh
./scripts/purge.sh

# Redémarrer
./scripts/deploy.sh
```

### Logs de débogage

#### Backend
```bash
# Logs en temps réel
tail -f logs/test_backend.log

# Logs d'erreur
grep "ERROR" logs/test_backend.log
```

#### Frontend
```bash
# Logs Expo
tail -f logs/test_frontend.log

# Logs Metro
npx expo start --clear
```

## 📁 Structure du projet

```
budget/
├── 📁 backend/                    # Backend FastAPI
│   ├── 📁 app/
│   │   ├──  core/              # Configuration
│   │   ├──  db/                # Base de données
│   │   ├──  models/            # Modèles MongoDB
│   │   ├──  routers/           # Routes API
│   │   ├──  schemas/           # Schémas Pydantic
│   │   └──  main.py            # Point d'entrée
│   ├── 📄 requirements.txt       # Dépendances Python
│   └── 📄 test_data.json         # Données de test
│
├── 📁 frontend/                   # Frontend React Native
│   ├── 📁 src/
│   │   ├──  screens/           # Écrans
│   │   ├──  services/          # Services API
│   │   ├──  navigation/        # Navigation
│   │   ├──  contexts/          # Contexte React
│   │   ├──  utils/             # Utilitaires
│   │   └──  config/            # Configuration
│   ├── 📄 package.json           # Dépendances Node.js
│   └── 📄 app.config.js          # Configuration Expo
│
├── 📁 scripts/                    # Scripts automatisés
│   ├── 📄 deploy.sh              # Déploiement
│   ├── 📄 test_all.sh            # Tests complets
│   ├── 📄 test_backend.sh        # Tests backend
│   ├── 📄 test_frontend.sh       # Tests frontend
│   ├── 📄 test_database.sh       # Tests DB
│   ├── 📄 stop.sh                # Arrêt services
│   ├── 📄 purge.sh               # Nettoyage
│   └── 📄 common.sh              # Fonctions communes
│
├── 📁 docs/                       # Documentation
│   ├── 📄 README.md              # Documentation principale
│   ├── 📄 ARCHITECTURE.md        # Architecture
│   ├── 📄 DEPLOYMENT.md          # Déploiement
│   ├── 📄 FRONTEND.md            # Frontend
│   └── 📄 backend_troubleshooting_guide.md
│
├── 📁 logs/                       # Fichiers de logs
│   ├──  test_database.log
│   ├──  test_backend.log
│   ├──  test_frontend.log
│   └──  test_all.log
│
└── 📁 test_data/                  # Données de test
    ├──  users.yaml
    ├── 📄 categories.yaml
    └──  transactions.yaml
```

## 🚀 Démarrage rapide en 5 étapes

### 1. Préparation
```bash
git clone <repository>
cd budget
```

### 2. Test automatique
```bash
./scripts/test_all.sh
```

### 3. Déploiement
```bash
./scripts/deploy.sh
```

### 4. Accès
- **Frontend** : http://localhost:19006
- **Backend** : http://localhost:8000/docs

### 5. Connexion
- **Email** : `test@example.com`
- **Mot de passe** : `password123`

## 📞 Support

### Ressources utiles
- **Documentation API** : http://localhost:8000/docs
- **Logs** : Répertoire `logs/`
- **Tests** : Scripts dans `scripts/`

### Commandes utiles
```bash
# État des services
./scripts/stop.sh && ./scripts/deploy.sh

# Nettoyage complet
./scripts/purge.sh

# Logs en temps réel
tail -f logs/test_all.log
```

---

**Développé avec ❤️ par Tony Auge**

*Dernière mise à jour : $(date)*
``` 