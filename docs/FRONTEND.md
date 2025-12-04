# Frontend - Application Budget

##  Vue d'ensemble

Le frontend de l'Application Budget est développé avec **React 18**, **Vite** et **Tailwind CSS**, offrant une expérience utilisateur moderne et responsive sur le web.

## 🛠️ Technologies utilisées

- **React** : 18.2.0 (bibliothèque UI)
- **Vite** : 5.4.14 (build tool ultra-rapide avec HMR)
- **React Router DOM** : 6.x (navigation SPA)
- **Tailwind CSS** : 3.x (framework CSS utility-first)
- **Lucide React** : Bibliothèque d'icônes modernes
- **LocalStorage** : Stockage local pour l'authentification JWT

## 📁 Structure du code

```
frontend/src/
├──  screens/           # Écrans de l'application
│   ├── LoginScreen.jsx    # Écran de connexion/inscription
│   ├── DashboardScreen.jsx # Tableau de bord principal
│   ├── TransactionsScreen.jsx # Liste et gestion des transactions
│   ├── AddTransactionScreen.jsx # Ajout/modification de transaction
│   ├── CategoriesScreen.jsx # Gestion des catégories hiérarchiques
│   ├── BudgetScreen.jsx # Gestion des budgets
│   ├── ReportsScreen.jsx # Statistiques et rapports mensuels
│   └── SettingsScreen.jsx # Paramètres utilisateur
├──  services/          # Services API
│   ├── authService.js    # Authentification (login, register)
│   ├── transactionService.js # CRUD transactions
│   ├── categoryService.js # CRUD catégories
│   ├── budgetService.js # CRUD budgets
│   ├── dashboardService.js # Données du dashboard
│   └── reportService.js # Rapports mensuels
├──  components/        # Composants réutilisables
│   ├── Navigation.jsx    # Barre de navigation
│   └── CategorySelector.jsx # Sélecteur de catégories hiérarchiques
├──  contexts/          # Contexte React
│   └── AuthContext.jsx    # Contexte d'authentification global
├──  utils/             # Utilitaires
│   └── formatters.js     # Formatage des montants (formatCurrency)
├──  config/            # Configuration
│   └── api.config.js     # Configuration API et gestion des erreurs
└──  constants/         # Constantes
    └── theme.js          # Thème et couleurs
```

##  Design System

### Couleurs principales (Tailwind CSS)
```javascript
const COLORS = {
  primary: 'blue-600',      // Bleu principal (#2563eb)
  secondary: 'green-600',    // Vert (#16a34a)
  danger: 'red-600',       // Rouge (#dc2626)
  warning: 'orange-500',      // Orange (#f97316)
  success: 'green-500',      // Vert succès (#22c55e)
  background: 'gray-50',   // Fond gris clair
  surface: 'white',      // Surface blanche
  text: {
    primary: 'gray-900',    // Texte principal
    secondary: 'gray-600',  // Texte secondaire
  }
};
```

### Composants de navigation
- Navigation responsive avec liens actifs
- Items : Tableau de bord, Transactions, Ajouter, Catégories, Budgets, Statistiques, Paramètres
- Gap de 12px pour garder les onglets sur une ligne
- Indicateur visuel pour la page active

##  Écrans détaillés

### 1. LoginScreen
**Fonctionnalités :**
- Formulaire de connexion/inscription
- Validation en temps réel des champs
- Gestion des erreurs avec messages clairs
- Stockage sécurisé du token JWT

**Champs :**
- Email (validation format email)
- Mot de passe (minimum 8 caractères)
- Prénom/Nom (inscription uniquement)

### 2. DashboardScreen
**Fonctionnalités :**
- Statistiques du mois en cours
- Solde actuel et évolution
- Graphique des dépenses par catégorie (top 5)
- Liste des 10 transactions récentes avec merchant
- Affichage hiérarchique des catégories ("Parent › Sous-catégorie")

**Données affichées :**
- Revenus du mois
- Dépenses du mois
- Solde net
- Top catégories de dépenses
- Transactions récentes (date, description, merchant, montant, catégorie)

### 3. TransactionsScreen
**Fonctionnalités :**
- Liste complète des transactions
- Filtrage par catégorie (incluant sous-catégories)
- Recherche par description ou merchant
- Tri par date (décroissant par défaut)
- Modification/Suppression en ligne
- Affichage "Parent › Sous-catégorie"

**Colonnes :**
- Date (format jj/mm/aaaa)
- Description
- Merchant (optionnel)
- Catégorie (avec hiérarchie)
- Montant (couleur verte pour revenus, rouge pour dépenses)
- Actions (modifier/supprimer)

### 4. AddTransactionScreen
**Fonctionnalités :**
- Ajout de nouvelles transactions
- Modification de transactions existantes
- Sélection de catégorie hiérarchique
- Champ merchant optionnel
- Validation des données

**Champs :**
- Date (date picker)
- Description (texte, requis)
- Merchant (texte, optionnel - ex: "Carrefour", "SNCF")
- Catégorie (sélecteur hiérarchique)
- Montant (nombre, requis)
- Type (revenus/dépenses via is_expense)

### 5. CategoriesScreen
**Fonctionnalités :**
- Gestion complète des catégories hiérarchiques
- Création de catégories parentes
- Création de sous-catégories (max 2 niveaux)
- Modification (nom, couleur, parent)
- Suppression avec confirmation
- Affichage hiérarchique avec indentation

**Hiérarchie :**
- Catégories parentes (parent_id = null)
- Sous-catégories (parent_id = id de la parente)
- Validation : maximum 2 niveaux
- Affichage : "Parent › Sous-catégorie"

**Couleurs :**
- Sélecteur de couleur pour chaque catégorie
- Couleurs par défaut disponibles
- Héritage visuel pour les sous-catégories

### 6. BudgetScreen
**Fonctionnalités :**
- Création de budgets mensuels par catégorie
- Calcul automatique incluant toutes les sous-catégories
- Indicateurs visuels de statut :
  - ✅ OK (vert) : < 80%
  - ⚠️ Attention (orange) : 80-99%
  - 🔺 Dépassé de X% (rouge) : ≥ 100%
- Liste expandable des transactions impliquées
- Regroupement par sous-catégorie avec couleurs
- Filtrage par mois en cours uniquement

**Affichage budget :**
- Nom de la catégorie
- Montant budgeté
- Montant dépensé
- Restant (avec signe - si dépassé)
- Barre de progression colorée
- Pourcentage ou "Dépassé de X%"

**Transactions détaillées :**
- Groupées par sous-catégorie
- Couleur de la sous-catégorie
- Total par sous-catégorie
- Liste chronologique (plus récentes en premier)

### 7. ReportsScreen
**Fonctionnalités :**
- Rapports mensuels sur 6 mois
- Graphiques interactifs
- Cartes de synthèse
- Tableau détaillé

**Métriques disponibles :**
- Revenus totaux et moyens
- Dépenses totales et moyennes
- Économies (revenus - dépenses)
- Taux d'épargne (%)
- Solde net mensuel

**Visualisations :**
- Graphique en barres interactif
- Sélection de métrique (revenus/dépenses/économies/net)
- Couleurs conditionnelles
- Pourcentages relatifs

**Tableau mensuel :**
- Colonnes : Mois, Revenus, Dépenses, Économies, Tx. épargne
- Format monétaire français
- Couleurs pour les économies positives/négatives

### 8. SettingsScreen
**Fonctionnalités :**
- Profil utilisateur
- Jour de cycle de facturation
- Déconnexion

## 🔐 Authentification et sécurité

### AuthContext
- Gestion centralisée de l'état d'authentification
- Stockage du token dans localStorage
- Protection automatique des routes
- Redirection après login/logout

### ProtectedRoute
- Composant wrapper pour les routes privées
- Vérification du token avant accès
- Redirection automatique vers /login si non authentifié

### API Configuration
- Base URL centralisée (http://localhost:8000)
- Ajout automatique du token Bearer dans les headers
- Gestion des erreurs avec classes personnalisées (ApiError)
- Timeout de 10 secondes par défaut

## 🎨 Composants réutilisables

### CategorySelector
**Fonctionnalités :**
- Sélection de catégorie avec hiérarchie
- Affichage "Parent › Sous-catégorie"
- Couleurs visuelles
- Filtrage des catégories (uniquement dépenses pour budgets/transactions dépenses)

**Props :**
- `value` : ID de la catégorie sélectionnée
- `onChange` : Callback lors du changement
- `filterExpense` : Boolean pour filtrer uniquement les catégories de dépenses

### Navigation
**Fonctionnalités :**
- Menu horizontal responsive
- Liens avec état actif
- Gap optimisé (12px) pour éviter la compression
- Icônes intégrées (Lucide React)

**Items :**
1. Tableau de bord (/)
2. Transactions (/transactions)
3. Ajouter (/add-transaction)
4. Catégories (/categories)
5. Budgets (/budgets)
6. Statistiques (/reports)
7. Paramètres (/settings)

## 📊 Formatage des données

### formatCurrency(amount)
Formate un montant en euros avec 2 décimales.
```javascript
formatCurrency(1234.56) // "1 234,56 €"
formatCurrency(-500) // "-500,00 €"
```

### Affichage hiérarchique
```javascript
// Parent uniquement
"Alimentation"

// Sous-catégorie
"Alimentation › Courses"
"Transport › Essence"
```

## 🚀 Optimisations

### Performance
- Utilisation de React hooks (useState, useEffect, useContext)
- Mise en cache des données de catégories
- Rechargement conditionnel basé sur les dépendances
- Lazy loading avec React.lazy() et Suspense
- Hot Module Replacement (HMR) de Vite pour le développement

### UX/UI
- **Messages utilisateur** : Utilisation d'encarts intégrés (divs stylisées), PAS de `window.alert()` ou `window.confirm()`
- Feedback visuel immédiat (couleurs, icônes, états de chargement)
- Messages d'erreur clairs et contextuels
- Loading states pendant les appels API
- Toasts/notifications pour les actions de confirmation

### Code
- Séparation des concerns (services/composants/screens)
- Configuration centralisée (api.config.js)
- Gestion d'erreur unifiée
- Composants fonctionnels avec hooks

## 🐛 Dépannage Frontend

### Problème : Page blanche au chargement
**Solutions :**
1. Vérifier la console du navigateur (F12)
2. Vérifier que le backend est démarré (http://localhost:8000)
3. Vider le cache et recharger (Ctrl+Shift+R)

### Problème : Erreur "Not authenticated"
**Solutions :**
1. Se déconnecter et se reconnecter
2. Vérifier que le token existe dans localStorage
3. Vérifier la date d'expiration du token

### Problème : Statistiques à 0
**Solutions :**
1. Vérifier que des transactions existent dans la base
2. Vérifier les logs backend pour les erreurs d'API
3. S'assurer que le user_id correspond dans les transactions

### Problème : Navigation compressée
**Solutions :**
1. Gap CSS réduit à 12px dans App.css
2. Pas de flex-wrap pour garder sur une ligne
3. Responsive design à vérifier pour petits écrans

## 📱 Développement

### Commandes utiles
```bash
# Démarrer le dev server (avec HMR)
npm run dev

# Build pour production
npm run build

# Preview du build de production
npm run preview

# Installer les dépendances
npm install

# Linter le code
npm run lint
```

### Variables d'environnement
Aucune variable d'environnement requise pour le moment. La configuration API est dans `src/config/api.config.js`.

### Hot Module Replacement (HMR)
Vite supporte le HMR automatiquement grâce à son build natif ultra-rapide. Les modifications sont visibles instantanément sans rechargement complet de la page, préservant l'état de l'application.

### Développement local
- **URL de développement** : http://localhost:19006
- **Port configurable** : `vite.config.js` → `server.port`
- **Proxy API** : Configuré pour éviter les problèmes CORS en développement

---

**Dernière mise à jour** : Décembre 2025  
**Version** : 1.0.0  
**Stack technique** : React 18 + Vite 5 + Tailwind CSS 3
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