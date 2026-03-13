use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::message::response::CreateMessageRequest;
use crate::domain::entities::message::Message;
use crate::domain::usecases::message::send_message::SendMessage;
use axum::extract::Path;
use axum::Json;

pub async fn create_message_handler(
    Path(channel_id): Path<String>,
    Json(request): Json<CreateMessageRequest>,
) -> Result<Json<Message>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMessageRepo;
        let repo_user = PostgresUserRepo; 
        let usecase = SendMessage { repo_message: &repo , repo_user: &repo_user};
        usecase.execute_with_gif(channel_id, request.user_id, request.content, request.is_gif.unwrap_or(false))
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message creation failed: {}", e)))?;
    Ok(Json(result))
}
