use crate::domain::entities::Member;
use crate::domain::usecases::server::JoinServerByInvite;
use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::{CreateServerRequest, CreateServerResponse};
use crate::domain::usecases::server::create::CreateServer;
use crate::domain::usecases::server::join::JoinServer;
use axum::Json;

pub async fn create_server_handler(
    Json(payload): Json<CreateServerRequest>,
) -> Result<Json<CreateServerResponse>, ApiError> {
    let user_id = payload.user_id.clone();

    // Créer le serveur
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let usecase = CreateServer { repo: &repo };
        usecase.execute(payload.name, payload.password)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server creation failed: {}", e)))?;

    let response = CreateServerResponse {
        server_id: result.server_id.clone(),
        name: result.name.clone(),
    };

    // Ajouter automatiquement le créateur comme membre avec le rôle admin
    let server_id = result.server_id.clone();
    let password = result.password.clone();

    let member_result: Result<Result<Member, String>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let repo2 = PostgresMemberRepo;
        let repo3 = PostgresRoleRepo;
        let ban_repo = PostgresBanRepo;
        let usecase = JoinServer {
            repo: &repo,
            repo2: &repo2,
            repo3: &repo3,
            ban_repo: &ban_repo,
        };
        let usecase = JoinServerByInvite{
            repo: &repo,
            repo2: &repo2,
            repo3: &repo3,
            ban_repo: &ban_repo,
        };
        usecase.execute(user_id, server_id, "role04".to_string())
    }).await;
    let member = member_result
        .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
        .map_err(|e| ApiError::BadRequest(format!("Failed to add creator as member: {}", e)))?;

    Ok(Json(response))
}
