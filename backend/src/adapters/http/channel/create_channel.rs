use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::domain::entities::channel::Channel;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::channel::create::CreateChannel;
use crate::adapters::websocket::{AppState, WsMessage};
use axum::Json;
use axum::extract::{Path, State};

pub async fn create_channel_handler(
    Path(server_id): Path<String>,
    State(state): State<AppState>,
    Json(name_channel): Json<String>,
) -> Result<Json<Channel>, ApiError> {
    let server_id_clone = server_id.clone();
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresChannelRepo;
        let usecase = CreateChannel { repo: &repo };
        usecase.execute(name_channel, server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel creation failed: {}", e)))?;

    // Broadcaster l'événement de création de canal à tous les clients du serveur
    let ws_message = WsMessage::ChannelCreated {
        channel_id: result.channel_id.clone(),
        name: result.name.clone(),
        server_id: result.server_id.clone(),
        create_at: result.create_at.clone(),
    };
    state.broadcast_to_server(&server_id_clone, ws_message).await;
    println!("📢 Événement channel_created broadcasted pour serveur: {}", server_id_clone);

    Ok(Json(result))
}
