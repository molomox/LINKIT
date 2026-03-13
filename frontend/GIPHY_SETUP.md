# Configuration de l'envoi de GIFs avec Giphy

## 📝 Fonctionnalités implémentées

✅ **Composant GifPicker** : Modal pour rechercher et sélectionner des GIFs
✅ **Bouton GIF** : Bouton cyan (🎬) dans MessageInput
✅ **Affichage des GIFs** : Les messages GIFs sont affichés comme des images
✅ **Traductions FR/EN** : Toutes les clés de traduction ajoutées
✅ **TypeScript** : Types mis à jour (Message, ApiMessage, WsMessage)
✅ **Base de données** : Champ `IS_GIF` déjà présent dans la table messages

## 🔧 Configuration requise

### 1. Obtenir une clé API Giphy

1. Créez un compte sur [Giphy Developers](https://developers.giphy.com/)
2. Créez une nouvelle application (SDK/API)
3. Copiez votre clé API

### 2. Configurer la clé API

Créez un fichier `.env.local` dans le dossier `frontend/` :

```bash
cd frontend
cp .env.local.example .env.local
```

Éditez `.env.local` et ajoutez votre clé API :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GIPHY_API_KEY=votre_clé_api_giphy_ici
```

### 3. Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C) et relancez
npm run dev
```

## 🎨 Utilisation

1. **Envoyer un GIF** :
   - Cliquez sur le bouton cyan 🎬 à côté de l'input de message
   - Recherchez un GIF dans la barre de recherche
   - Cliquez sur le GIF pour l'envoyer

2. **Affichage des GIFs** :
   - Les GIFs s'affichent automatiquement dans les messages
   - Style cyberpunk avec bordures jaunes et coins coupés
   - Lazy loading pour de meilleures performances

## 🔥 Modifications apportées

### Frontend

#### Fichiers modifiés :
- `src/components/GifPicker.tsx` - Composant modal pour sélectionner des GIFs
- `src/app/servers/[serverId]/features/messages/components/MessageInput.tsx` - Ajout du bouton GIF
- `src/app/servers/[serverId]/features/messages/components/MessageItem.tsx` - Affichage des GIFs
- `src/app/servers/[serverId]/page.tsx` - Fonction `handleGifSelect()` pour envoyer les GIFs
- `src/app/servers/[serverId]/types.ts` - Ajout du champ `is_gif` aux types Message et ApiMessage
- `src/hooks/useWebSocket.ts` - Ajout du champ `is_gif` au type WsMessage
- `src/i18n/locales/fr.ts` - Clés de traduction en français pour les GIFs
- `src/i18n/locales/en.ts` - Clés de traduction en anglais pour les GIFs

#### Fichiers créés :
- `.env.local.example` - Template pour la configuration
- `GIPHY_SETUP.md` - Ce fichier de documentation

### Backend

Le backend doit gérer le champ `is_gif` lors de la réception des messages :

```rust
// Dans les handlers de messages
pub struct CreateMessageDto {
    pub content: String,
    pub user_id: String,
    pub is_gif: Option<bool>, // ← À ajouter si pas déjà présent
}
```

La base de données PostgreSQL contient déjà le champ `IS_GIF BOOLEAN NOT NULL DEFAULT FALSE` dans la table `messages`.

## 🎯 Tests à effectuer

- [ ] Le bouton GIF apparaît dans l'input de message
- [ ] Le modal GifPicker s'ouvre au clic
- [ ] La recherche de GIFs fonctionne avec Giphy
- [ ] Les GIFs trending s'affichent au démarrage
- [ ] La sélection d'un GIF l'envoie dans le canal
- [ ] Les GIFs s'affichent correctement dans les messages
- [ ] Les traductions FR/EN fonctionnent dans le GifPicker
- [ ] Le WebSocket transmet correctement `is_gif: true`

## 🐛 Dépannage

### Le bouton GIF ne marche pas
- Vérifiez que `.env.local` existe et contient `NEXT_PUBLIC_GIPHY_API_KEY`
- Redémarrez le serveur après avoir modifié `.env.local`

### Aucun GIF ne s'affiche
- Vérifiez votre clé API sur https://developers.giphy.com/dashboard/
- Assurez-vous que votre clé API est active et n'a pas atteint sa limite de requêtes

### Les GIFs ne s'envoient pas
- Vérifiez que le backend accepte le champ `is_gif` dans les messages
- Consultez la console du navigateur pour les erreurs

## 📚 Ressources

- [Documentation Giphy API](https://developers.giphy.com/docs/api/)
- [Limites de l'API Giphy](https://developers.giphy.com/docs/api/#rate-limits) (42 requêtes/heure en version gratuite)
