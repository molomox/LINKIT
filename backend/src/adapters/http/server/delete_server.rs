use crate::{
    adapters::{
        db::postgres_server_repository::PostgresServerRepo,
        http::error::ApiError,
        websocket::{AppState, WsMessage},
    },
    domain::usecases::server::delete::DeleteServer,
};
use axum::{extract::{Path, State}, Json};

pub async fn delete_server_handler(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
) -> Result<Json<String>, ApiError> {
    let server_id_for_event = server_id.clone();
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = DeleteServer { repo: &repo };
        usecase.execute(server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server deletion failed: {}", e)))?;

    state
        .broadcast_to_server(
            &server_id_for_event,
            WsMessage::ServerDeleted {
                server_id: server_id_for_event.clone(),
            },
        )
        .await;

    Ok(Json(result))
}
