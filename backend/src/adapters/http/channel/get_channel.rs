use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::domain::entities::channel::Channel;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::channel::get::GetChannelDetails;
use axum::Json;
use axum::extract::Path;

pub async fn get_channel_handler(
    Path(channel_id): Path<String>,
) -> Result<Json<Channel>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresChannelRepo;
        let usecase = GetChannelDetails { repo: &repo };
        usecase.execute(channel_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel retrieval failed: {}", e)))?;
    Ok(Json(result))
}
