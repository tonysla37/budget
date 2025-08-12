# Frontend de l'Application Budget

Ce répertoire contient le code source du frontend de l'application Budget, développée avec React Native pour offrir une expérience mobile optimisée.

## Technologies utilisées

- **React Native**: Framework JavaScript pour le développement mobile cross-platform
- **Expo**: Plateforme facilitant le développement React Native
- **Axios**: Client HTTP pour les requêtes API
- **React Navigation**: Navigation entre les écrans de l'application
- **Redux**: Gestion de l'état global de l'application

## Structure du projet

```
frontend/
├── assets/             # Ressources statiques (images, polices, etc.)
├── src/                # Code source principal
│   ├── config/         # Configuration (API, environnement)
│   ├── screens/        # Écrans de l'application
│   └── services/       # Services pour les appels API
├── app.config.js       # Configuration Expo
├── babel.config.js     # Configuration Babel
├── index.js            # Point d'entrée de l'application
├── package.json        # Dépendances et scripts npm
└── README.md           # Documentation
```

## Installation

1. Assurez-vous d'avoir Node.js (v14+) et npm installés
2. Installez les dépendances:
   ```bash
   npm install
   ```

## Démarrage

Pour lancer l'application en mode développement:

```bash
./deploy_test.sh
```

Ou manuellement:

```bash
npm start
```

Cela démarrera le serveur Expo et vous pourrez:
- Ouvrir l'application dans un émulateur iOS/Android
- Scanner le QR code avec l'app Expo Go sur votre appareil mobile
- Exécuter dans le navigateur web avec l'option "w"

## Communication avec le backend

L'application se connecte au backend FastAPI déployé par défaut sur:
- URL: http://localhost:8000
- Endpoints API: voir la documentation OpenAPI à http://localhost:8000/docs

## Débogage

Les logs de débogage sont disponibles dans:
- `frontend_deploy.log` - Journal principal du déploiement
- `frontend_debug.log` - Journal de débogage détaillé 