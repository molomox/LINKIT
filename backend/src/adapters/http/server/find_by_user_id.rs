use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::server::Server;
use crate::domain::usecases::server::list::ListUserServers;
use crate::domain::jwt::Claims;
use axum::{Json, extract::Extension};

pub async fn get_user_server_handler(
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Server>>, ApiError> {
    let user_id = claims.sub;
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = ListUserServers { repo: &repo };
        usecase.execute(user_id.as_str())
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server retrieval failed: {}", e)))?;

    Ok(Json(result))
}
