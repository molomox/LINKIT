use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::entities::channel::Channel;
use crate::domain::usecases::channel::update::UpdateChannel;
use axum::extract::{Path, State};
use axum::Json;

pub async fn update_channel_handler(
    Path(channel_id): Path<String>,
    State(state): State<AppState>,
    Json(name_channel): Json<String>,
) -> Result<Json<Channel>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresChannelRepo;
        let usecase = UpdateChannel { repo: &repo };
        usecase.execute(channel_id, name_channel)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel update failed: {}", e)))?;

    // Broadcaster l'événement de mise à jour
    let ws_message = WsMessage::ChannelUpdated {
        channel_id: result.channel_id.clone(),
        name: result.name.clone(),
        server_id: result.server_id.clone(),
    };
    state
        .broadcast_to_server(&result.server_id, ws_message)
        .await;
    println!(
        "📢 Événement channel_updated broadcasted pour serveur: {}",
        result.server_id
    );

    Ok(Json(result))
}
