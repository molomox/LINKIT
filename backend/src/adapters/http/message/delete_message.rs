use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::message::delete_message::DeleteMessage;
use axum::Json;
use axum::extract::Path;

pub async fn delete_message_handler(
    Path(message_id): Path<String>,
) -> Result<Json<String>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMessageRepo;
        let usecase = DeleteMessage { repo: &repo };
        usecase.execute(message_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message deletion failed: {}", e)))?;
    Ok(Json(result))
}
