use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::message::Message;
use crate::domain::usecases::message::list_message::ListMessage;
use axum::extract::Path;
use axum::Json;

pub async fn get_message_list_handler(
    Path(channel_id): Path<String>,
) -> Result<Json<Vec<Message>>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMessageRepo;
        let usecase = ListMessage { repo: &repo };
        usecase.execute(channel_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message list retrieval failed: {}", e)))?;
    Ok(Json(result))
}
