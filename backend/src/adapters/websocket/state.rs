use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use super::types::WsMessage;

/// Type alias pour les clients WebSocket
pub type Clients = Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>;

/// État partagé pour gérer les connexions WebSocket
#[derive(Clone)]
pub struct AppState {
    pub clients: Clients,
}

impl AppState {
    /// Créer un nouveau AppState
    pub fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Broadcaster un événement de canal/serveur à tous les clients d'un serveur
    pub async fn broadcast_to_server(&self, server_id: &str, message: WsMessage) {
        let server_key = format!("server:{}", server_id);
        let clients = self.clients.read().await;
        
        if let Some(tx) = clients.get(&server_key) {
            if let Ok(json) = serde_json::to_string(&message) {
                let _ = tx.send(json);
            }
        }
    }

    pub async fn broadcast_to_channel(&self, channel_id: &str, message: WsMessage){
        let clients = self.clients.read().await;
        if let Some(tx) = clients.get(channel_id) {
            if let Ok(json) = serde_json::to_string(&message) {
                let _ = tx.send(json);
            }
        }
    }
}
