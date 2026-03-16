use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::usecases::message::update_message::UpdateMessage;
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateMessageRequest {
    pub content: String,
    pub user_id: String,
}

pub async fn update_message_handler(
    State(state): State<AppState>,
    Path(message_id): Path<String>,
    Json(payload): Json<UpdateMessageRequest>,
) -> Result<Json<String>, ApiError> {
    let message_id_clone = message_id.clone();
    let user_id = payload.user_id.clone();
    let content = payload.content.clone();

    // Mettre à jour le message avec vérification des permissions
    let (channel_id, message_id_result, username) = tokio::task::spawn_blocking(move || {
        let message_repo = PostgresMessageRepo;
        let channel_repo = PostgresChannelRepo;
        let member_repo = PostgresMemberRepo;

        let usecase = UpdateMessage {
            message_repo: &message_repo,
            channel_repo: &channel_repo,
            member_repo: &member_repo,
        };

        usecase.execute(message_id_clone, user_id, content)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message update failed: {}", e)))?;

    // Broadcast la modification
    let updated_msg = WsMessage::MessageUpdated {
        message_id: message_id.clone(),
        content: payload.content,
        channel_id: channel_id.clone(),
        user_id: payload.user_id,
        username,
    };
    state.broadcast_to_channel(&channel_id, updated_msg).await;

    Ok(Json(message_id))
}
