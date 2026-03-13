use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::{CreateServerResponse, JoinServerRequest};
use crate::domain::entities::member::Member;
use crate::domain::usecases::server::join::JoinServer;
use crate::domain::usecases::server::leave::LeaveServer;
use axum::extract::Path;
use axum::Json;

pub async fn delete_member_handler(
    Path(server_id): Path<String>,
    Json(user_id): Json<String>,
) -> Result<Json<()>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMemberRepo;
        let usecase = LeaveServer { repo: &repo };
        usecase.execute(user_id, server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server leaving failed: {}", e)))?;

    Ok(Json(result))
}
