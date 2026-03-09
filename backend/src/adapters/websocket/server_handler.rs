use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::state::AppState;
use super::types::{IncomingWsMessage, WsMessage};

/// Gestion de la connexion WebSocket au niveau serveur (pour les événements de canaux et membres)
pub async fn handle_server_socket(socket: WebSocket, server_id: String, state: AppState) {
    println!("🟢 WebSocket connecté au serveur: {}", server_id);

    let (mut sender, mut receiver) = socket.split();

    // Créer ou récupérer le broadcaster pour ce serveur (avec préfixe "server:")
    let server_key = format!("server:{}", server_id);
    let tx = {
        let mut clients = state.clients.write().await;
        clients
            .entry(server_key.clone())
            .or_insert_with(|| tokio::sync::broadcast::channel(100).0)
            .clone()
    };

    let mut rx = tx.subscribe();

    // Variables partagées pour stocker l'identité de l'utilisateur
    let current_user_id = Arc::new(RwLock::new(None::<String>));
    let current_username = Arc::new(RwLock::new(None::<String>));

    // Task pour envoyer les messages depuis le broadcast vers le WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task pour recevoir les messages du WebSocket
    let tx_clone = tx.clone();
    let user_id_clone = current_user_id.clone();
    let username_clone = current_username.clone();
    let server_id_clone = server_id.clone();
    
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Gérer les messages entrants
                    if let Ok(incoming_msg) = serde_json::from_str::<IncomingWsMessage>(&text) {
                        match incoming_msg {
                            IncomingWsMessage::Identify { user_id, username } => {
                                // Stocker l'identité de l'utilisateur
                                *user_id_clone.write().await = Some(user_id.clone());
                                *username_clone.write().await = Some(username.clone());
                                
                                println!("👤 Utilisateur identifié: {} ({})", username, user_id);
                                
                                // Broadcaster user_online
                                let online_msg = WsMessage::UserOnline {
                                    user_id: user_id.clone(),
                                    username: username.clone(),
                                    server_id: server_id_clone.clone(),
                                };
                                if let Ok(json) = serde_json::to_string(&online_msg) {
                                    let _ = tx_clone.send(json);
                                }
                            }
                            IncomingWsMessage::Ping => {
                                let pong = WsMessage::Pong;
                                if let Ok(json) = serde_json::to_string(&pong) {
                                    let _ = tx_clone.send(json);
                                }
                            }
                            _ => {}
                        }
                    }
                }
                Message::Close(_) => {
                    println!("🔴 Client a fermé la connexion pour serveur: {}", server_key);
                    break;
                }
                _ => {}
            }
        }
    });

    // Attendre que l'une des tasks se termine
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    // Broadcaster user_offline à la déconnexion
    let uid = current_user_id.read().await;
    let uname = current_username.read().await;
    if let (Some(user_id), Some(username)) = (uid.as_ref(), uname.as_ref()) {
        let offline_msg = WsMessage::UserOffline {
            user_id: user_id.clone(),
            username: username.clone(),
            server_id: server_id.clone(),
        };
        if let Ok(json) = serde_json::to_string(&offline_msg) {
            let _ = tx.send(json);
            println!("👋 Utilisateur déconnecté: {} ({})", username, user_id);
        }
    }

    println!("🔌 WebSocket déconnecté pour serveur: {}", server_id);
}
