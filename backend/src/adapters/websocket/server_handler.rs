use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};

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

    // Task pour envoyer les messages depuis le broadcast vers le WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task pour recevoir les messages du WebSocket (principalement ping/pong)
    let tx_clone = tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Gérer les pings
                    if let Ok(incoming_msg) = serde_json::from_str::<IncomingWsMessage>(&text) {
                        if matches!(incoming_msg, IncomingWsMessage::Ping) {
                            let pong = WsMessage::Pong;
                            if let Ok(json) = serde_json::to_string(&pong) {
                                let _ = tx_clone.send(json);
                            }
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

    println!("🔌 WebSocket déconnecté pour serveur: {}", server_id);
}
