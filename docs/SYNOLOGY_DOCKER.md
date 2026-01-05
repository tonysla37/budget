# Déploiement sur NAS Synology (Docker)

Ce guide explique comment lancer l'application Budget (backend + frontend + MongoDB) sur un NAS Synology via Docker / Docker Compose.

## 1. Pré-requis

- Paquet **Docker** installé sur le NAS Synology
- Accès SSH au NAS (facultatif mais recommandé)
- Ports disponibles :
  - **8000** pour le backend
  - **19006** pour le frontend
  - **27017** pour MongoDB (optionnel, seulement si exposé)

## 2. Fichiers Docker/NAS

Tous les fichiers liés à Docker et au NAS sont regroupés dans le dossier `docker/` à la racine du projet :

- `docker/backend.Dockerfile` : image du backend FastAPI
- `docker/frontend.Dockerfile` : image du frontend React (Vite)
- `docker/docker-compose.yml` : orchestre MongoDB + backend + frontend

## 3. Configuration de l'URL API côté frontend

L'URL de l'API est passée au frontend via la variable d'environnement `VITE_API_URL`.

Dans `docker/docker-compose.yml`, le service `frontend` définit :

```yaml
  frontend:
    environment:
      - VITE_API_URL=${VITE_API_URL:-https://localhost:8000}
```

### 3.1. Test local (PC / VM Linux)

Dans le dossier `docker/` :

```bash
cp .env.example .env   # première fois
```

Le fichier `.env` contient par défaut :

```env
VITE_API_URL=https://localhost:8000
```

Tu peux alors lancer :

```bash
cd /chemin/vers/budget/docker
docker compose up -d --build
```

Puis tester (certificats auto-signés, le navigateur affichera un avertissement) :

- Backend : https://localhost:8000/docs
- Frontend : https://localhost:19006

### 3.2. Sur NAS Synology

Sur le NAS, adapte `VITE_API_URL` dans le fichier `.env` (dans le dossier `docker/`) ou dans l'interface Docker Synology :

- Si tu accèdes au NAS via `https://mon-nas.maison:8000` → `VITE_API_URL=https://mon-nas.maison:8000`
- Si tu accèdes via son IP locale, par ex. `https://192.168.1.50:8000` → `VITE_API_URL=https://192.168.1.50:8000`

Cette variable est l'URL que le navigateur utilisera pour joindre l'API backend.

> Remarque : si tu mets en place un reverse proxy Synology (recommandé), configure ici l'URL publique finale exposée par le NAS et reporte-la dans `VITE_API_URL`.

## 4. Démarrage avec Docker Compose (en SSH)

Sur un terminal connecté au NAS (dans le dossier du projet) :

```bash
cd /chemin/vers/budget/docker

# Construire et lancer les conteneurs
docker compose up -d --build

# Vérifier l'état
docker ps
```

Services attendus :

- `budget-mongo` : MongoDB
- `budget-backend` : API FastAPI exposée en HTTPS sur le port 8000 du NAS (avec certificats montés dans `certs/`)
- `budget-frontend` : frontend Vite exposé en HTTPS sur le port 19006 du NAS (HTTPS auto-détecté via les mêmes certificats)

## 5. Accès à l'application

- Frontend :
  - `https://NAS_IP:19006` (certificats auto-signés) ou via reverse proxy HTTPS Synology
- Backend (Swagger) :
  - `https://NAS_IP:8000/docs` (certificats auto-signés) ou via reverse proxy HTTPS

## 6. Utiliser un MongoDB externe (optionnel)

Si ton NAS héberge déjà MongoDB en dehors de Docker, modifie dans `docker-compose.yml` :

- Supprime ou commente le service `mongo`
- Dans le service `backend`, adapte :

```yaml
environment:
  - MONGODB_URI=mongodb://TON_MONGO:27017
  - MONGODB_DB_NAME=budget_db
```

## 7. Intégration avec le reverse proxy Synology (optionnel)

Pour exposer l'appli proprement en HTTPS :

1. Dans DSM → **Panneau de configuration → Portail des applications → Proxy inverse**
2. Crée une règle :
   - Source :
     - Hôte : `budget.mondomaine.tld`
     - Port : `443`
   - Destination :
     - Protocole : `HTTP`
     - Hôte : `localhost`
     - Port : `19006` (frontend)
3. (Optionnel) Crée une 2ᵉ règle pour l'API si tu veux un domaine/chemin séparé.

Pense à ajuster `VITE_API_URL` pour qu'il pointe vers l'URL externe du backend vue par le navigateur.

## 8. Arrêt / redémarrage

```bash
# Arrêter
cd /chemin/vers/budget/docker
docker compose down

# Redémarrer sans reconstruire
docker compose up -d
```

---

Pour aller plus loin, on pourra ensuite :
- Rajouter les certificats SSL dans le conteneur backend (HTTPS direct)
- Affiner les ressources allouées (RAM/CPU) côté Synology
- Ajouter des volumes dédiés pour `logs/` et `certs/` si besoin.
