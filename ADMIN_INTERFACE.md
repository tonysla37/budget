# Interface d'Administration

## 🎯 Fonctionnalités

L'interface d'administration permet aux utilisateurs avec le rôle `admin` de :

### 👥 Gestion des Utilisateurs
- **Visualiser tous les utilisateurs** de la plateforme
- **Modifier les rôles** (user ↔ admin)
- **Activer/Désactiver** les comptes utilisateurs
- **Supprimer des utilisateurs** et toutes leurs données
- **Rechercher** par email, nom, prénom

### 🔐 Gestion des Certificats SSL
- **Voir le statut** du certificat actuel (validité, expiration)
- **Uploader** un nouveau certificat SSL (.pem, .crt)
- **Uploader** une nouvelle clé privée (.pem, .key)
- **Régénérer** des certificats auto-signés
- **Télécharger** le certificat actuel

## 🚀 Accès

### URL
```
https://10.37.16.90:19006/admin
```

### Pré-requis
- Être connecté avec un compte ayant le rôle `admin`
- Le lien "👑 Administration" apparaît automatiquement dans le menu de navigation

### Utilisateur Test Admin
```
Email: test@example.com
Password: test
Rôle: admin
```

## 📡 Endpoints Backend

### Gestion des Utilisateurs
```
GET    /api/admin/users               # Liste tous les utilisateurs
PATCH  /api/admin/users/:id/role      # Modifie le rôle d'un utilisateur
PATCH  /api/admin/users/:id/active    # Active/désactive un utilisateur
DELETE /api/admin/users/:id           # Supprime un utilisateur
```

### Gestion SSL
```
GET    /api/admin/ssl/status               # Statut du certificat
POST   /api/admin/ssl/upload-certificate   # Upload certificat
POST   /api/admin/ssl/upload-key           # Upload clé privée
POST   /api/admin/ssl/regenerate            # Régénérer auto-signés
GET    /api/admin/ssl/download-certificate # Télécharger certificat
```

## 🔒 Sécurité

### Protection des Endpoints
Tous les endpoints `/api/admin/*` sont protégés par le middleware `require_admin`

### Protection Frontend
La route `/admin` vérifie le rôle avant l'affichage

### Restrictions
- ❌ Un admin **ne peut pas modifier son propre rôle**
- ❌ Un admin **ne peut pas se désactiver lui-même**
- ❌ Un admin **ne peut pas se supprimer lui-même**

## 📖 Documentation Swagger

L'interface Swagger documente tous les endpoints admin :
```
https://10.37.16.90:8000/docs
```
