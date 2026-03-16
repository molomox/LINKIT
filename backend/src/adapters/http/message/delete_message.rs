use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::usecases::message::delete_message::DeleteMessage;
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct DeleteMessageRequest {
    pub user_id: String,
}

pub async fn delete_message_handler(
    State(state): State<AppState>,
    Path(message_id): Path<String>,
    Json(payload): Json<DeleteMessageRequest>,
) -> Result<Json<String>, ApiError> {
    let message_id_clone = message_id.clone();
    let user_id = payload.user_id;

    // Supprimer le message avec vérification des permissions
    let channel_id = tokio::task::spawn_blocking(move || {
        let message_repo = PostgresMessageRepo;
        let channel_repo = PostgresChannelRepo;
        let member_repo = PostgresMemberRepo;

        let usecase = DeleteMessage {
            message_repo: &message_repo,
            channel_repo: &channel_repo,
            member_repo: &member_repo,
        };

        usecase.execute(message_id_clone, user_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message deletion failed: {}", e)))?;

    // Broadcast la suppression
    let deleted_msg = WsMessage::MessageDeleted {
        message_id: message_id.clone(),
        channel_id: channel_id.clone(),
    };
    state.broadcast_to_channel(&channel_id, deleted_msg).await;

    Ok(Json(message_id))
}
