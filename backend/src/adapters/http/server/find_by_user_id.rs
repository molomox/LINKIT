use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::server::Server;
use crate::domain::usecases::server::list::ListUserServers;
use axum::{extract::Query, Json};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UserIdQuery {
    pub user_id: String,
}

pub async fn get_user_server_handler(
    Query(query): Query<UserIdQuery>,
) -> Result<Json<Vec<Server>>, ApiError> {
    let user_id = query.user_id;
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
