use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::channel::delete::DeleteChannel;
use crate::domain::ports::channel_repository::ChannelRepository;
use crate::adapters::websocket::{AppState, WsMessage};
use axum::Json;
use axum::extract::{Path, State};

pub async fn delete_channel_handler(
    Path(channel_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<String>, ApiError> {
    // Récupérer d'abord le canal pour obtenir le server_id
    let channel_info = tokio::task::spawn_blocking({
        let channel_id_clone = channel_id.clone();
        move || {
            let repo = PostgresChannelRepo;
            repo.find_by_id(channel_id_clone)
        }
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel not found: {}", e)))?;

    let server_id = channel_info.server_id.clone();

    // Supprimer le canal
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresChannelRepo;
        let usecase = DeleteChannel { repo: &repo };
        usecase.execute(channel_id.clone())
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel deletion failed: {}", e)))?;

    // Broadcaster l'événement de suppression
    let ws_message = WsMessage::ChannelDeleted {
        channel_id: channel_info.channel_id,
        server_id: server_id.clone(),
    };
    state.broadcast_to_server(&server_id, ws_message).await;
    println!("📢 Événement channel_deleted broadcasted pour serveur: {}", server_id);

    Ok(Json(result))
}
