use crate::domain::entities::server::Server;
use crate::domain::usecases::server::get::GetServerDetails;
use crate::adapters::http::error::ApiError;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use axum::{Json, extract::Path};

pub async fn get_server_handler(
    Path(server_id): Path<String>,
) -> Result<Json<Server>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = GetServerDetails { repo: &repo };
        usecase.execute(server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server retrieval failed: {}", e)))?;

    Ok(Json(result))
}

