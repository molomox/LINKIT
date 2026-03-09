use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::domain::entities::member::Member;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::JoinServerRequest;
use crate::domain::usecases::server::join::JoinServer;
use axum::Json;
use axum::extract::Path;

pub async fn join_server_handler(
    Path(server_id): Path<String>,
    Json(join_request): Json<JoinServerRequest>,
) -> Result<Json<Member>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let repo2 = PostgresMemberRepo;
        let repo3 = PostgresRoleRepo;
        let usecase = JoinServer { repo: &repo, repo2: &repo2, repo3: &repo3 };
        usecase.execute( join_request.user_id, server_id,join_request.password, "role01".to_string())
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server joining failed: {}", e)))?;

    Ok(Json(result))
}
