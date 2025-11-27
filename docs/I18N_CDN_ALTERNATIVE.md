# Alternative i18n avec CDN (Sans npm install)

## 🚫 Problème
Le registre npm est bloqué par l'entreprise, impossible d'installer i18next et react-i18next.

## ✅ Solution 1 : Utiliser les CDN directement

### 1. Modifier `frontend/index.html`

Ajoutez ces scripts dans le `<head>` ou avant `</body>` :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Budget App</title>
    
    <!-- i18next depuis CDN -->
    <script src="https://unpkg.com/i18next@23.7.6/dist/umd/i18next.min.js"></script>
    <script src="https://unpkg.com/react-i18next@13.5.0/dist/umd/react-i18next.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 2. Modifier `frontend/src/i18n.js`

Utilisez les variables globales au lieu d'imports :

```javascript
// Utiliser les objets globaux chargés depuis CDN
const { default: i18n } = window.i18next || { default: null };
const { initReactI18next } = window.ReactI18next || { initReactI18next: null };

import fr from './locales/fr.json';
import en from './locales/en.json';

// Détection de la langue du navigateur
const getBrowserLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
};

// Récupération de la langue sauvegardée
const savedLanguage = localStorage.getItem('language') || getBrowserLanguage();

if (i18n && initReactI18next) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        fr: { translation: fr },
        en: { translation: en }
      },
      lng: savedLanguage,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false
      }
    });

  // Sauvegarder la langue quand elle change
  i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  });
}

export default i18n;
```

## ✅ Solution 2 : Utiliser yarn (alternative à npm)

```bash
# Installer yarn si pas déjà fait
npm install -g yarn  # Si npm fonctionne pour les packages globaux

# Ou télécharger yarn standalone
curl -o- -L https://yarnpkg.com/install.sh | bash

# Puis installer les packages
cd frontend
yarn add i18next react-i18next
```

## ✅ Solution 3 : Configurer un proxy npm

Si votre entreprise a un proxy :

```bash
# Configurer le proxy npm
npm config set proxy http://proxy.entreprise.com:8080
npm config set https-proxy http://proxy.entreprise.com:8080

# Vérifier la config
npm config list

# Réessayer l'installation
npm install i18next react-i18next
```

## ✅ Solution 4 : Installation hors réseau entreprise

1. **Avec hotspot mobile** :
   ```bash
   # Connectez-vous à votre hotspot mobile
   cd frontend
   npm install i18next react-i18next
   ```

2. **Depuis votre domicile** :
   - Installez les packages chez vous
   - Committez `node_modules` (exceptionnellement)
   - Ou créez un package tarball :
     ```bash
     npm pack i18next
     npm pack react-i18next
     # Transférez les .tgz à l'entreprise
     npm install i18next-23.7.6.tgz react-i18next-13.5.0.tgz
     ```

## ✅ Solution 5 : Utiliser un registre miroir

```bash
# Utiliser le registre Taobao (Chine) ou autre miroir
npm config set registry https://registry.npmmirror.com
npm install i18next react-i18next

# Revenir au registre officiel après
npm config set registry https://registry.npmjs.org
```

## 🎯 Solution recommandée

**Pour un déploiement rapide : Solution 1 (CDN)**
- ✅ Pas besoin de npm install
- ✅ Fonctionne immédiatement
- ✅ Pas de dépendances à gérer
- ⚠️ Nécessite une connexion internet en production

**Pour un projet professionnel : Solution 3 ou 4**
- ✅ Packages locaux
- ✅ Pas de dépendance externe en production
- ✅ Meilleure performance

## 📝 Test sans installation

Pour tester si le CDN fonctionne :

```bash
# Ouvrir la console du navigateur
# Taper : window.i18next
# Si un objet apparaît → CDN chargé ✅
```

## 🔧 Fichiers à modifier pour CDN

1. `frontend/index.html` - Ajouter les scripts CDN
2. `frontend/src/i18n.js` - Utiliser window.i18next
3. Supprimer les imports dans `package.json` (optionnel)

Les autres fichiers (Navigation.jsx, LoginScreen.jsx, etc.) restent inchangés.
