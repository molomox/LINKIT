use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::RwLock;

use super::state::AppState;
use super::types::{IncomingWsMessage, WsMessage};

/// Gestion de la connexion WebSocket pour un channel
pub async fn handle_socket(socket: WebSocket, channel_id: String, state: AppState) {
    println!("🟢 WebSocket connecté pour channel: {}", channel_id);

    let (mut sender, mut receiver) = socket.split();

    // Créer ou récupérer le broadcaster pour ce channel
    let tx = {
        let mut clients = state.clients.write().await;
        clients
            .entry(channel_id.clone())
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

    // Task pour recevoir les messages du WebSocket et les broadcaster
    let tx_clone = tx.clone();
    let state_clone = state.clone();
    let channel_id_for_recv = channel_id.clone();
    let user_id_clone = current_user_id.clone();
    let username_clone = current_username.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    handle_text_message(
                        &text,
                        &tx_clone,
                        &channel_id_for_recv,
                        &state_clone,
                        &user_id_clone,
                        &username_clone,
                    )
                    .await;
                }
                Message::Close(_) => {
                    println!(
                        "🔴 Client a fermé la connexion pour channel: {}",
                        channel_id_for_recv
                    );
                    broadcast_user_left(
                        &tx_clone,
                        &user_id_clone,
                        &username_clone,
                        &channel_id_for_recv,
                    )
                    .await;
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

    // Broadcaster user_left à la déconnexion (si pas déjà fait)
    broadcast_user_left(&tx, &current_user_id, &current_username, &channel_id).await;

    println!("🔌 WebSocket déconnecté pour channel: {}", channel_id);
}

/// Gérer un message texte reçu du WebSocket
async fn handle_text_message(
    text: &str,
    tx: &tokio::sync::broadcast::Sender<String>,
    channel_id: &str,
    state: &AppState,
    user_id: &Arc<RwLock<Option<String>>>,
    username: &Arc<RwLock<Option<String>>>,
) {
    match serde_json::from_str::<IncomingWsMessage>(text) {
        Ok(incoming_msg) => match incoming_msg {
            IncomingWsMessage::NewMessage {
                content,
                user_id: uid,
                username: uname,
                is_gif,
                server_id,
                ..
            } => {
                handle_new_message(tx, state, channel_id, user_id, username, content, uid, uname, is_gif, server_id).await;
            }
            IncomingWsMessage::Ping => {
                send_pong(tx).await;
            }
            IncomingWsMessage::Typing {
                user_id: uid,
                username: uname,
                channel_id: cid,
            } => {
                broadcast_typing(tx, uid, uname, cid).await;
            }
            _ => {
                // Ignorer les autres types de messages (ex: Identify utilisé pour les WebSockets serveur)
            }
        },
        Err(e) => {
            eprintln!(
                "❌ Erreur parsing message WebSocket: {} - Message: {}",
                e, text
            );
        }
    }
}

/// Gérer un nouveau message
async fn handle_new_message(
    tx: &tokio::sync::broadcast::Sender<String>,
    state: &AppState,
    channel_id: &str,
    user_id_arc: &Arc<RwLock<Option<String>>>,
    username_arc: &Arc<RwLock<Option<String>>>,
    content: String,
    user_id: String,
    username: String,
    is_gif: bool,
    server_id: Option<String>,
) {
    // Capturer l'identité de l'utilisateur au premier message
    let is_first_message = {
        let uid = user_id_arc.read().await;
        uid.is_none()
    };

    if is_first_message {
        *user_id_arc.write().await = Some(user_id.clone());
        *username_arc.write().await = Some(username.clone());

        // Broadcaster user_joined
        if let Some(ref srv_id) = server_id {
            let joined_msg = WsMessage::UserJoined {
                user_id: user_id.clone(),
                username: username.clone(),
                server_id: srv_id.clone(),
            };
            if let Ok(json) = serde_json::to_string(&joined_msg) {
                let _ = tx.send(json);
                println!("👤 User joined: {} ({})", username, user_id);
            }
        }
    }

    // Ignorer les messages vides (messages de présence uniquement)
    if content.trim().is_empty() {
        println!("📡 Message de présence reçu (ignoré): {}", username);
        return;
    }

    // Sauvegarder le message en base de données
    let message_result = tokio::task::spawn_blocking({
        let channel_id = channel_id.to_string();
        let content = content.clone();
        let user_id = user_id.clone();
        move || {
            use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
            use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
            use crate::domain::usecases::message::send_message::SendMessage;

            let repo = PostgresMessageRepo;
            let repo_user = PostgresUserRepo;
            let use_case = SendMessage { repo_message: &repo, repo_user: &repo_user };
            use_case.execute_with_gif(channel_id, user_id, content, is_gif)
        }
    })
    .await;

    match message_result {
        Ok(Ok(saved_message)) => {
            // Clone fields once so we can use them in both channel and server broadcasts.
            let message_id = saved_message.message_id.clone();
            let message_content = saved_message.content.clone();
            let message_channel_id = saved_message.channel_id.clone();
            let message_user_id = saved_message.user.user_id.clone();
            let message_username = saved_message.user.username.clone();
            let message_created_at = saved_message.create_at;
            let message_is_gif = saved_message.is_gif;

            // Créer le message WS SORTANT avec les vraies données de la DB
            let broadcast_msg = WsMessage::NewMessage {
                message_id,
                content: message_content.clone(),
                user_id: message_user_id.clone(),
                username: message_username.clone(),
                channel_id: message_channel_id.clone(),
                create_at: message_created_at,
                is_gif: message_is_gif,
            };

            // Broadcaster le message à tous les clients
            if let Ok(json) = serde_json::to_string(&broadcast_msg) {
                let _ = tx.send(json);
            }

            // For DM channels, also notify server-level websocket so recipient can receive updates even outside DM view.
            let dm_info = tokio::task::spawn_blocking({
                let channel_id = message_channel_id.clone();
                let sender_user_id = message_user_id.clone();
                move || -> Result<Option<(String, String)>, String> {
                    use postgres::{Client, NoTls};
                    use crate::adapters::http::constants::db_url;

                    let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
                    let row = client
                        .query_opt(
                            "SELECT user_id, user2_id FROM channel_dm WHERE channel_id = $1",
                            &[&channel_id],
                        )
                        .map_err(|e| e.to_string())?;

                    let Some(dm_row) = row else {
                        return Ok(None);
                    };

                    let u1: String = dm_row.get(0);
                    let u2: String = dm_row.get(1);
                    let other_user_id = if sender_user_id == u1 { u2 } else { u1 };

                    let server_row = client
                        .query_opt(
                            "SELECT m1.server_id
                             FROM members m1
                             JOIN members m2 ON m1.server_id = m2.server_id
                             WHERE m1.user_id = $1 AND m2.user_id = $2
                             LIMIT 1",
                            &[&sender_user_id, &other_user_id],
                        )
                        .map_err(|e| e.to_string())?;

                    let Some(server_row) = server_row else {
                        return Ok(None);
                    };

                    let server_id: String = server_row.get(0);
                    Ok(Some((server_id, other_user_id)))
                }
            })
            .await;

            if let Ok(Ok(Some((dm_server_id, to_user_id)))) = dm_info {
                let preview = if message_is_gif {
                    "GIF".to_string()
                } else {
                    message_content.chars().take(80).collect()
                };

                state
                    .broadcast_to_server(
                        &dm_server_id,
                        WsMessage::DmMessage {
                            channel_id: message_channel_id,
                            server_id: dm_server_id.clone(),
                            from_user_id: message_user_id,
                            from_username: message_username,
                            to_user_id,
                            preview,
                            is_gif: message_is_gif,
                        },
                    )
                    .await;
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

/// Envoyer un pong en réponse à un ping
async fn send_pong(tx: &tokio::sync::broadcast::Sender<String>) {
    let pong = WsMessage::Pong;
    if let Ok(json) = serde_json::to_string(&pong) {
        let _ = tx.send(json);
    }
}

/// Broadcaster un événement "typing"
async fn broadcast_typing(
    tx: &tokio::sync::broadcast::Sender<String>,
    user_id: String,
    username: String,
    channel_id: String,
) {
    let typing_msg = WsMessage::Typing {
        user_id,
        username,
        channel_id,
    };
    if let Ok(json) = serde_json::to_string(&typing_msg) {
        let _ = tx.send(json);
    }
}

/// Broadcaster un événement user_left
async fn broadcast_user_left(
    tx: &tokio::sync::broadcast::Sender<String>,
    user_id: &Arc<RwLock<Option<String>>>,
    username: &Arc<RwLock<Option<String>>>,
    channel_id: &str,
) {
    let uid = user_id.read().await;
    let uname = username.read().await;
    if let (Some(user_id), Some(username)) = (uid.as_ref(), uname.as_ref()) {
        let left_msg = WsMessage::UserLeft {
            user_id: user_id.clone(),
            username: username.clone(),
            server_id: channel_id.to_string(),
        };
        if let Ok(json) = serde_json::to_string(&left_msg) {
            let _ = tx.send(json);
            println!("👋 User left: {} ({})", username, user_id);
        }
    }
}
