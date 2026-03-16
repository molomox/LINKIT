use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::domain::entities::member::Member;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::JoinServerRequest;
use crate::domain::jwt::Claims;
use crate::domain::usecases::server::join::JoinServer;
use axum::Json;
use axum::extract::{Extension, Path};

pub async fn join_server_handler(
    Path(server_id): Path<String>,
    Extension(claims): Extension<Claims>,
    Json(join_request): Json<JoinServerRequest>,
) -> Result<Json<Member>, ApiError> {
    if join_request.user_id != claims.sub {
        return Err(ApiError::Unauthorized("Cannot join server for another user".to_string()));
    }

    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let repo2 = PostgresMemberRepo;
        let repo3 = PostgresRoleRepo;
        let ban_repo = PostgresBanRepo;
        let usecase = JoinServer { repo: &repo, repo2: &repo2, repo3: &repo3, ban_repo: &ban_repo };
        usecase.execute( join_request.user_id, server_id,join_request.password, "role02".to_string())
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server joining failed: {}", e)))?;

    Ok(Json(result))
}
