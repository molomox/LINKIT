use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::message::response::CreateMessageRequest;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::message::Message;
use crate::domain::usecases::message::send_message::SendMessage;
use axum::Json;
use axum::extract::Path;

pub async fn create_message_handler(
    Path(channel_id): Path<String>,
    Json(request): Json<CreateMessageRequest>,
) -> Result<Json<Message>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMessageRepo;
        let usecase = SendMessage { repo: &repo };
        usecase.execute(channel_id, request.user_id, request.content)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message creation failed: {}", e)))?;
    Ok(Json(result))
}
