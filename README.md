# 🎮 L!NKYT - Application de Messagerie Cyberpunk

Une application de messagerie en temps réel avec un style **Cyberpunk 2077**, construite avec **Rust (Axum)** pour le backend et **Next.js** pour le frontend.

---
## POC
POC DB : https://docs.google.com/document/d/1pOV15IExMksgI6ahP3ud8PW_Hh4x59o8UUh-aVZT-ig/edit?usp=sharing
---
## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)
```bash
./start.sh
```

### Option 2 : Démarrage Manuel

**Terminal 1 - Base de données :**
```bash
docker-compose up -d
```

**Terminal 2 - Backend :**
```bash
cd backend
cargo run
```

**Terminal 3 - Frontend :**
```bash
cd frontend
npm run dev
```

---

## 📍 URLs de l'Application

- **Backend API** : http://localhost:3000
- **Frontend** : http://localhost:3001
- **Inscription** : http://localhost:3001/register
- **Connexion** : http://localhost:3001/auth/login
- **Dashboard** : http://localhost:3001/auth/me

---

## 🏗️ Architecture

### Backend (Rust + Axum)
- **Framework** : Axum (async web framework)
- **Base de données** : PostgreSQL
- **Architecture** : Clean Architecture (ports & adapters)

**Routes disponibles :**

**Users :**
- `POST /auth/signup` - Créer un compte
- `POST /user/login` - Se connecter
- `POST /auth/logout` - Se déconnecter
- `GET /me` - Obtenir le profil utilisateur

**Servers :**
- `GET /servers` - Liste des serveurs
- `POST /servers` - Créer un serveur
- `GET /servers/:server_id` - Détails d'un serveur
- `DELETE /servers/:server_id` - Supprimer un serveur
- `PUT /servers/:server_id` - Modifier un serveur
- `POST /servers/:server_id/join` - Rejoindre un serveur
- `DELETE /servers/:server_id/leave` - Quitter un serveur

### Frontend (Next.js + TypeScript)
- **Framework** : Next.js 14 (App Router)
- **Styling** : Tailwind CSS
- **Thème** : Cyberpunk 2077 (jaune/noir/rouge)

**Pages :**
- `/register` - Page d'inscription
- `/auth/login` - Page de connexion
- `/auth/me` - Dashboard avec profil et serveurs

---

## 🎨 Style Cyberpunk

Toutes les pages utilisent un thème cohérent inspiré de **Cyberpunk 2077** :

- 🟡 **Couleurs principales** : Jaune (#FFD700), Rouge (#FF0055), Noir (#0a0a0a)
- 🔲 **Design** : Coins coupés (clipPath), bordures néon
- 📺 **Effets** : Grille cyberpunk, scanlines, animations glitch
- 🔤 **Typographie** : Monospace, tout en majuscules
- ⚡ **Interactions** : Hover effects, transitions fluides

---

## 🧪 Tests

### Test de la Route d'Inscription
```bash
./test-signup.sh
```

Ou manuellement :
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123","email":"demo@example.com"}'
```

### Test de la Route de Login
```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123","email":""}'
```

---

## 🔍 Debug

### Logs Frontend
Ouvrez la console du navigateur (F12) pour voir :
- 🔵 Requêtes API envoyées
- 🔵 Status des réponses
- ✅ Succès des opérations
- 🔴 Erreurs détaillées

### Logs Backend
Le terminal du backend affiche :
- Routes disponibles au démarrage
- Requêtes HTTP reçues
- Erreurs de base de données

### Guide de Dépannage
Consultez `DEBUG.md` pour un guide complet de résolution des problèmes.

---

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

---

## 📦 Structure du Projet

```
T-JSF-600-NAN_6/
├── backend/              # API Rust/Axum
│   ├── src/
│   │   ├── adapters/     # Couche d'adaptation (HTTP, DB)
│   │   ├── domain/       # Logique métier
│   │   └── main.rs       # Point d'entrée
│   └── Cargo.toml
├── frontend/             # Application Next.js
│   ├── src/
│   │   └── app/          # Pages et composants
│   ├── package.json
│   └── .env.local
├── compose.yaml          # Configuration Docker
├── init.sql              # Script d'initialisation DB
├── start.sh              # Script de démarrage
└── test-signup.sh        # Script de test
```

---

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

## 🚧 TODO / Améliorations Futures

- [ ] Système de tokens JWT persistant
- [ ] Gestion des sessions
- [ ] Chat en temps réel (WebSocket)
- [ ] Upload d'avatar
- [ ] Notifications
- [ ] Dark/Light mode toggle
- [ ] Tests unitaires et d'intégration
- [ ] Déploiement (Docker, CI/CD)

---

## 🤝 Contribution

Ce projet est un projet éducatif. N'hésitez pas à :
- Ouvrir des issues pour signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

---

## 📄 Licence

Projet réalisé dans le cadre de T-JSF-600-NAN_6

---

## 🎯 Contact & Support

Pour toute question ou problème :
1. Consultez `DEBUG.md` pour les problèmes courants
2. Vérifiez les logs dans la console (F12)
3. Testez les routes avec `./test-signup.sh`

---

## 🌟 Crédits

- **Design inspiré de** : Cyberpunk 2077
- **Technologies** : Rust, Axum, Next.js, TypeScript, Tailwind CSS
- **Architecture** : Clean Architecture / Hexagonal Architecture

---

**Fait avec 💛 en 2026 - Welcome to Night City! 🌃**
