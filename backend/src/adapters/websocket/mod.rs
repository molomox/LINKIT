use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::Response,
    routing::get,
    Router,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::Arc,
};
use tokio::sync::{broadcast, RwLock};

// Messages ENTRANTS du frontend (sans message_id car pas encore créé)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum IncomingWsMessage {
    #[serde(rename = "new_message")]
    NewMessage {
        content: String,
        user_id: String,
        username: String,
        channel_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        server_id: Option<String>,
    },
    #[serde(rename = "typing")]
    Typing {
        user_id: String,
        username: String,
        channel_id: String,
    },
    #[serde(rename = "ping")]
    Ping,
}

// Messages SORTANTS vers le frontend (avec message_id généré)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "new_message")]
    NewMessage {
        message_id: String,
        content: String,
        user_id: String,
        username: String,
        channel_id: String,
        create_at: String,
    },
    #[serde(rename = "user_joined")]
    UserJoined {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "user_left")]
    UserLeft {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "typing")]
    Typing {
        user_id: String,
        username: String,
        channel_id: String,
    },
    #[serde(rename = "channel_created")]
    ChannelCreated {
        channel_id: String,
        name: String,
        server_id: String,
        create_at: String,
    },
    #[serde(rename = "channel_updated")]
    ChannelUpdated {
        channel_id: String,
        name: String,
        server_id: String,
    },
    #[serde(rename = "channel_deleted")]
    ChannelDeleted {
        channel_id: String,
        server_id: String,
    },
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,
}

// État partagé pour gérer les connexions WebSocket
pub type Clients = Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>;

#[derive(Clone)]
pub struct AppState {
    pub clients: Clients,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Broadcaster un événement de canal à tous les clients du serveur
    pub async fn broadcast_to_server(&self, server_id: &str, message: WsMessage) {
        let server_key = format!("server:{}", server_id);
        let clients = self.clients.read().await;
        
        if let Some(tx) = clients.get(&server_key) {
            if let Ok(json) = serde_json::to_string(&message) {
                let _ = tx.send(json);
            }
        }
    }
}

// Route WebSocket pour un channel spécifique
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(channel_id): Path<String>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, channel_id, state))
}

// Route WebSocket pour un serveur (pour les événements de canaux)
pub async fn ws_server_handler(
    ws: WebSocketUpgrade,
    Path(server_id): Path<String>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_server_socket(socket, server_id, state))
}

// Gestion de la connexion WebSocket au niveau serveur
async fn handle_server_socket(socket: WebSocket, server_id: String, state: AppState) {
    println!("🟢 WebSocket connecté au serveur: {}", server_id);

    let (mut sender, mut receiver) = socket.split();

    // Créer ou récupérer le broadcaster pour ce serveur (avec préfixe "server:")
    let server_key = format!("server:{}", server_id);
    let tx = {
        let mut clients = state.clients.write().await;
        clients
            .entry(server_key.clone())
            .or_insert_with(|| broadcast::channel(100).0)
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

// Gestion de la connexion WebSocket
async fn handle_socket(socket: WebSocket, channel_id: String, state: AppState) {
    println!("🟢 WebSocket connecté pour channel: {}", channel_id);

    let (mut sender, mut receiver) = socket.split();

    // Créer ou récupérer le broadcaster pour ce channel
    let tx = {
        let mut clients = state.clients.write().await;
        clients
            .entry(channel_id.clone())
            .or_insert_with(|| broadcast::channel(100).0)
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

    // Task pour recevoir les messages du WebSocket et les broadcaster
    let tx_clone = tx.clone();
    let channel_id_for_recv = channel_id.clone();
    let user_id_clone = current_user_id.clone();
    let username_clone = current_username.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Parser le message JSON ENTRANT (sans message_id)
                    match serde_json::from_str::<IncomingWsMessage>(&text) {
                        Ok(incoming_msg) => {
                            match incoming_msg {
                                IncomingWsMessage::NewMessage { content, user_id, username, server_id, .. } => {
                                    // Capturer l'identité de l'utilisateur au premier message
                                    let is_first_message = {
                                        let uid = user_id_clone.read().await;
                                        uid.is_none()
                                    };

                                    if is_first_message {
                                        *user_id_clone.write().await = Some(user_id.clone());
                                        *username_clone.write().await = Some(username.clone());

                                        // Broadcaster user_joined
                                        if let Some(ref srv_id) = server_id {
                                            let joined_msg = WsMessage::UserJoined {
                                                user_id: user_id.clone(),
                                                username: username.clone(),
                                                server_id: srv_id.clone(),
                                            };
                                            if let Ok(json) = serde_json::to_string(&joined_msg) {
                                                let _ = tx_clone.send(json);
                                                println!("👤 User joined: {} ({})", username, user_id);
                                            }
                                        }
                                    }

                                    // Ignorer les messages vides (messages de présence uniquement)
                                    if content.trim().is_empty() {
                                        println!("📡 Message de présence reçu (ignoré): {}", username);
                                        continue;
                                    }

                                    // Sauvegarder le message en base de données
                                    let message_result = tokio::task::spawn_blocking({
                                        let channel_id = channel_id_for_recv.clone();
                                        let content = content.clone();
                                        let user_id = user_id.clone();
                                        move || {
                                            use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
                                            use crate::domain::usecases::message::send_message::SendMessage;

                                            let repo = PostgresMessageRepo;
                                            let usecase = SendMessage { repo: &repo };
                                            usecase.execute(channel_id, user_id, content)
                                        }
                                    }).await;

                                    match message_result {
                                        Ok(Ok(saved_message)) => {
                                            // Créer le message WS SORTANT avec les vraies données de la DB
                                            let broadcast_msg = WsMessage::NewMessage {
                                                message_id: saved_message.message_id,
                                                content: saved_message.content,
                                                user_id: saved_message.user.user_id,
                                                username: saved_message.user.username,
                                                channel_id: saved_message.channel_id,
                                                create_at: saved_message.create_at,
                                            };

                                            // Broadcaster le message à tous les clients
                                            if let Ok(json) = serde_json::to_string(&broadcast_msg) {
                                                let _ = tx_clone.send(json);
                                            }
                                        }
                                        Ok(Err(e)) => {
                                            eprintln!("❌ Erreur sauvegarde message: {}", e);
                                        }
                                        Err(e) => {
                                            eprintln!("❌ Erreur task: {}", e);
                                        }
                                    }
                                }
                                IncomingWsMessage::Ping => {
                                    // Répondre au ping avec un pong
                                    let pong = WsMessage::Pong;
                                    if let Ok(json) = serde_json::to_string(&pong) {
                                        let _ = tx_clone.send(json);
                                    }
                                }
                                IncomingWsMessage::Typing { user_id, username, channel_id } => {
                                    // Broadcaster l'événement "typing" aux autres clients
                                    let typing_msg = WsMessage::Typing {
                                        user_id,
                                        username,
                                        channel_id
                                    };
                                    if let Ok(json) = serde_json::to_string(&typing_msg) {
                                        let _ = tx_clone.send(json);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ Erreur parsing message WebSocket: {} - Message: {}", e, text);
                        }
                    }
                }
                Message::Close(_) => {
                    println!("🔴 Client a fermé la connexion pour channel: {}", channel_id_for_recv);

                    // Broadcaster user_left si on connaît l'utilisateur
                    let uid = user_id_clone.read().await;
                    let uname = username_clone.read().await;
                    if let (Some(user_id), Some(username)) = (uid.as_ref(), uname.as_ref()) {
                        let left_msg = WsMessage::UserLeft {
                            user_id: user_id.clone(),
                            username: username.clone(),
                            server_id: channel_id_for_recv.clone(),
                        };
                        if let Ok(json) = serde_json::to_string(&left_msg) {
                            let _ = tx_clone.send(json);
                            println!("👋 User left: {} ({})", username, user_id);
                        }
                    }

                    break;
                }
                _ => {
                    // Ignorer les autres types de messages (Binary, Ping, Pong)
                }
            }
        }
    });

    // Attendre que l'une des tasks se termine
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    // Broadcaster user_left à la déconnexion (si pas déjà fait)
    let uid = current_user_id.read().await;
    let uname = current_username.read().await;
    if let (Some(user_id), Some(username)) = (uid.as_ref(), uname.as_ref()) {
        let left_msg = WsMessage::UserLeft {
            user_id: user_id.clone(),
            username: username.clone(),
            server_id: channel_id.clone(),
        };
        if let Ok(json) = serde_json::to_string(&left_msg) {
            let _ = tx.send(json);
            println!("👋 User left (disconnect): {} ({})", username, user_id);
        }
    }

    println!("🔌 WebSocket déconnecté pour channel: {}", channel_id);
}

// Router WebSocket
pub fn websocket_routes(state: AppState) -> Router {
    Router::new()
        .route("/ws/channels/:channel_id", get(ws_handler))
        .route("/ws/servers/:server_id", get(ws_server_handler))
        .with_state(state)
}
