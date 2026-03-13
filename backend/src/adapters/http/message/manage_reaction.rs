use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::message::Message;
use crate::domain::usecases::message::manage_reaction::ManageReaction;
use axum::Json;
use axum::extract::Path;

pub async fn manage_reaction_handler(
    Path(message_id): Path<String>,
    Json(payload): Json<CreateReactionResponse>,
) -> Result<Json<String>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let message_repo = PostgresMessageRepo;
        let user_repo = PostgresUserRepo;
        let usecase = ManageReaction {
            message_repo: &message_repo,
            user_repo: &user_repo,
        };
        usecase.execute(channel_id,payload.user_id,payload.reaction_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Message list retrieval failed: {}", e)))?;
    Ok(Json(result))
}
