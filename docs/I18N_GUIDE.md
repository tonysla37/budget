# Guide d'Installation i18n

## 🎯 Activation du système multilingue

Le système d'internationalisation (français/anglais) a été configuré. Voici comment l'activer :

### 1. Installation des dépendances

```bash
cd /home/lab-telegraf/code/budget/frontend
npm install
```

Cela installera :
- `i18next@^23.7.6`
- `react-i18next@^13.5.0`

### 2. Démarrage

```bash
npm run dev
```

Ou utilisez le script dédié :

```bash
cd /home/lab-telegraf/code/budget
./scripts/start_frontend_i18n.sh
```

### 3. Utilisation

1. Ouvrez l'application dans votre navigateur
2. Dans la barre de navigation, cliquez sur le bouton avec l'icône 🌐 et le label **FR** ou **EN**
3. La langue change instantanément
4. Votre choix est sauvegardé et persistera entre les sessions

### 4. Langues disponibles

- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **English**

## 📝 Ce qui a été traduit

✅ **Navigation complète** :
- Tous les onglets (Tableau de bord, Transactions, etc.)
- Bouton de déconnexion
- Nom de l'application

✅ **Dates et mois** :
- Plus de "November" en dur
- Tous les noms de mois traduits dynamiquement
- Format court et long

✅ **Écran de connexion** :
- Titres et sous-titres
- Labels des champs
- Boutons et liens

✅ **Messages système** :
- Loading, erreurs, succès
- Actions communes (save, delete, edit, etc.)

## 🔧 Problèmes réseau ?

Si `npm install` échoue à cause du réseau :

1. Attendez quelques minutes
2. Réessayez : `npm install`
3. Ou installez les packages un par un :
   ```bash
   npm install i18next
   npm install react-i18next
   ```

## 📚 Documentation technique

Pour les détails techniques complets, consultez :
- `.ai-work/I18N_IMPLEMENTATION.md`

## ✨ Prochaines étapes

Les traductions sont prêtes pour tous les écrans. Les développeurs peuvent maintenant :

1. Importer `useTranslation` dans chaque composant
2. Utiliser `const { t } = useTranslation()`
3. Remplacer les textes par `t('section.key')`

Exemple :
```jsx
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
}
```

Les clés sont déjà définies dans :
- `frontend/src/locales/fr.json`
- `frontend/src/locales/en.json`
