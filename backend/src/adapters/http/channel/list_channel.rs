use crate::adapters::db::postgres_channel_repository::PostgresChannelRepo;
use crate::domain::entities::channel::Channel;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::channel::create::CreateChannel;
use crate::domain::usecases::channel::list_channel::ListServerChannel;
use axum::Json;
use axum::extract::Path;

pub async fn list_channel_handler(
    Path(server_id): Path<String>
) -> Result<Json<Vec<Channel>>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresChannelRepo;
        let usecase = ListServerChannel { repo: &repo };
        usecase.execute(server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Channel listing failed: {}", e)))?;
    Ok(Json(result))
}
