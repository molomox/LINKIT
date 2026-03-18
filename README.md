# 🎮 L!NKYT - Application de Messagerie Cyberpunk

Une application de messagerie en temps réel avec un style **Cyberpunk 2077**, construite avec **Rust (Axum)** pour le backend et **Next.js** pour le frontend.

---
## POC
POC DB : https://docs.google.com/document/d/1pOV15IExMksgI6ahP3ud8PW_Hh4x59o8UUh-aVZT-ig/edit?usp=sharing
---
## 🚀 Démarrage Rapide

### Configuration des Variables d'Environnement

**⚠️ OBLIGATOIRE** : Le projet nécessite un fichier `.env` pour fonctionner. Un fichier `.env` par défaut est déjà créé à la racine.

**🔐 SÉCURITÉ IMPORTANTE :**
- Le code ne contient **AUCUNE valeur par défaut** pour les secrets
- Sans JWT_SECRET configuré, **le serveur refuse de démarrer**
- Sans fichier `.env`, docker-compose échouera

**Pour la production, CHANGEZ OBLIGATOIREMENT :**

1. **Générer un JWT_SECRET sécurisé :**
   ```bash
   openssl rand -base64 64
   ```

2. **Modifier le fichier `.env` à la racine du projet :**
   - `JWT_SECRET` : Remplacez par la clé générée ci-dessus (OBLIGATOIRE)
   - `POSTGRES_PASSWORD` : Utilisez un mot de passe fort
   - `POSTGRES_USER` : Changez le nom d'utilisateur par défaut
   - `POSTGRES_DB` : Changez le nom de la base de données

**Vérification de sécurité :**
```bash
# Le serveur affichera au démarrage :
# 🔐 JWT_SECRET configuré ✓
# Si vous voyez ce message, votre configuration est OK
```

### Option 1 : Script Automatique (Recommandé)
```bash
docker-compose up
```


## 📍 URLs de l'Application

- **Backend API** : http://localhost:3000
- **Frontend** : http://localhost:3001


## 🎨 Style Cyberpunk

Toutes les pages utilisent un thème cohérent inspiré de **Cyberpunk 2077** :

- 🟡 **Couleurs principales** : Jaune (#FFD700), Rouge (#FF0055), Noir (#0a0a0a)
- 🔲 **Design** : Coins coupés (clipPath), bordures néon
- 📺 **Effets** : Grille cyberpunk, scanlines, animations glitch
- 🔤 **Typographie** : Monospace, tout en majuscules
- ⚡ **Interactions** : Hover effects, transitions fluides


## 🛠️ Technologies Utilisées

### Backend
- **Rust** - Langage système performant et sûr
- **Axum** - Framework web async
- **Tokio** - Runtime async
- **PostgreSQL** - Base de données relationnelle
- **Tower-HTTP** - Middleware CORS
- **Serde** - Sérialisation JSON

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling utilitaire
- **React Hooks** - Gestion d'état



## ✅ Fonctionnalités

### Authentification
- [x] Inscription avec username, email, password
- [x] Connexion avec username et password
- [x] Stockage des données utilisateur dans localStorage
- [x] Redirection automatique après login

### Dashboard
- [x] Profil utilisateur (avatar, username, email, user_id, date de création)
- [x] Liste des serveurs de l'utilisateur
- [x] Statistiques (nombre de serveurs, contacts)
- [x] Bouton Edit Profile
- [x] Bouton Logout

### Design
- [x] Thème Cyberpunk 2077 cohérent sur toutes les pages
- [x] Responsive design
- [x] Animations et transitions
- [x] Effets visuels (grille, scanlines, glitch)

---

