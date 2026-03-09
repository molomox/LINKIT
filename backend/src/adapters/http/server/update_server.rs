use crate::adapters::http::server::response::CreateServerRequest;
use crate::domain::entities::server::Server;
use crate::adapters::http::error::ApiError;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::domain::usecases::server::update::UpdateServer;
use axum::Json;
use axum::extract::Path;

pub async fn update_server_handler(
    Path(server_id): Path<String>,
    Json(payload): Json<CreateServerRequest>,
) -> Result<Json<Server>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = UpdateServer { repo: &repo };
        usecase.execute(server_id, payload.name, payload.password)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server update failed: {}", e)))?;

    Ok(Json(result))
}
