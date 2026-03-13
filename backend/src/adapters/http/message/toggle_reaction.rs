use axum::extract::Path;
use axum::Json;

use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::db::postgres_reaction_repository::PostgresReactionRepo;
use crate::adapters::db::postgres_reagi_repository::PostgresReagiRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::message::response::{ToggleReactionRequest, ToggleReactionResponse};
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::reaction_repository::ReactionRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::reaction::toggle_message_reaction::ToggleMessageReaction;

pub async fn toggle_reaction_handler(
    Path((message_id, reaction_id)): Path<(String, i32)>,
    Json(request): Json<ToggleReactionRequest>,
) -> Result<Json<ToggleReactionResponse>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let reaction_repo = PostgresReactionRepo;
        let reagi_repo = PostgresReagiRepo;
        let user_repo = PostgresUserRepo;
        let message_repo = PostgresMessageRepo;

        let user = user_repo.find_by_id(request.user_id)?;
        let message = message_repo.find_by_id(message_id)?;
        let reaction = reaction_repo.find_by_id(reaction_id)?;

        let usecase = ToggleMessageReaction {
            reaction_repo: &reaction_repo,
            reagi_repo: &reagi_repo,
        };

        usecase.execute(user, message, reaction)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Reaction toggle failed: {}", e)))?;

    Ok(Json(ToggleReactionResponse { status: result }))
}
