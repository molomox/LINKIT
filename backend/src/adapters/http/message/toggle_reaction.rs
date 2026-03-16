use axum::extract::Path;
use axum::Json;

use crate::adapters::db::postgres_message_repository::PostgresMessageRepo;
use crate::adapters::db::postgres_reaction_repository::PostgresReactionRepo;
use crate::adapters::db::postgres_reagi_repository::PostgresReagiRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::message::response::{ToggleReactionRequest, ToggleReactionResponse};
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::reaction_repository::ReactionRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::reaction::toggle_message_reaction::ToggleMessageReaction;
use axum::extract::State;

pub async fn toggle_reaction_handler(
    State(state): State<AppState>,
    Path((message_id, reaction_id)): Path<(String, i32)>,
    Json(request): Json<ToggleReactionRequest>,
) -> Result<Json<ToggleReactionResponse>, ApiError> {
    let message_id_for_lookup = message_id.clone();
    let request_user_id = request.user_id.clone();
    let result = tokio::task::spawn_blocking(move || {
        let reaction_repo = PostgresReactionRepo;
        let reagi_repo = PostgresReagiRepo;
        let user_repo = PostgresUserRepo;
        let message_repo = PostgresMessageRepo;

        let user = user_repo.find_by_id(request.user_id)?;
        let message = message_repo.find_by_id(message_id_for_lookup)?;
        let reaction = reaction_repo.find_by_id(reaction_id)?;

        let channel_id = message.channel_id.clone();
        let emoji = reaction.emoji.clone();
        let reaction_name = reaction.reaction_name.clone();

        let usecase = ToggleMessageReaction {
            reaction_repo: &reaction_repo,
            reagi_repo: &reagi_repo,
        };

        let status = usecase.execute(user, message, reaction)?;
        Ok::<(String, String, String, i32, String, String), String>((
            status,
            channel_id,
            request_user_id,
            reaction_id,
            emoji,
            reaction_name,
        ))
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Reaction toggle failed: {}", e)))?;

    let (status, channel_id, user_id, reaction_id, emoji, reaction_name) = result;
    let channel_id_for_broadcast = channel_id.clone();

    state
        .broadcast_to_channel(
            &channel_id_for_broadcast,
            WsMessage::ReactionToggled {
                message_id,
                channel_id,
                user_id,
                reaction_id,
                emoji,
                reaction_name,
                status: status.clone(),
            },
        )
        .await;

    Ok(Json(ToggleReactionResponse { status }))
}
