use axum::Json;

use crate::adapters::db::postgres_reaction_repository::PostgresReactionRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::reaction::Reaction;
use crate::domain::usecases::reaction::list_available_reactions::ListAvailableReactions;

pub async fn get_reactions_handler() -> Result<Json<Vec<Reaction>>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresReactionRepo;
        let usecase = ListAvailableReactions { repo: &repo };
        usecase.execute()
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Reaction list retrieval failed: {}", e)))?;

    Ok(Json(result))
}
