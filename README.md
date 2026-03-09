# 🎮 L!NKYT - Application de Messagerie Cyberpunk

Une application de messagerie en temps réel avec un style **Cyberpunk 2077**, construite avec **Rust (Axum)** pour le backend et **Next.js** pour le frontend.

---
## POC
POC DB : https://docs.google.com/document/d/1pOV15IExMksgI6ahP3ud8PW_Hh4x59o8UUh-aVZT-ig/edit?usp=sharing
---
## 🚀 Démarrage Rapide

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

## 🚧 TODO / Améliorations Futures

- [ ] Système de tokens JWT persistant
- [ ] Gestion des sessions
- [ ] Chat en temps réel (WebSocket)
- [ ] Upload d'avatar
- [ ] Notifications
- [ ] Dark/Light mode toggle
- [ ] Tests unitaires et d'intégration
- [ ] Déploiement (Docker, CI/CD)
