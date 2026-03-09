use crate::{adapters::{db::postgres_server_repository::PostgresServerRepo, http::error::ApiError}, domain::usecases::server::delete::DeleteServer};
use axum::{Json, extract::Path};

pub async fn delete_server_handler(
    Path(server_id): Path<String>,
) -> Result<Json<String>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = DeleteServer { repo: &repo };
        usecase.execute(server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server deletion failed: {}", e)))?;
    
    Ok(Json(result))
}