use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::domain::entities::member::Member;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::server::join_by_invite::JoinServerByInvite;
use axum::Json;
use axum::extract::{Path, State};
use serde::Deserialize;
use crate::adapters::websocket::{AppState, WsMessage};

#[derive(Deserialize)]
pub struct JoinByInviteRequest {
    pub user_id: String,
}

pub async fn join_server_by_invite_handler(
    State(state): State<AppState>,
    Path(invite_code): Path<String>,
    Json(request): Json<JoinByInviteRequest>,
) -> Result<Json<Member>, ApiError> {
    let member = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let repo2 = PostgresMemberRepo;
        let repo3 = PostgresRoleRepo;
        let usecase = JoinServerByInvite { repo: &repo, repo2: &repo2, repo3: &repo3 };
        usecase.execute(request.user_id, invite_code, "role02".to_string())
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server joining by invite failed: {}", e)))?;
    state.broadcast_to_server(
        &member.server.server_id,
        WsMessage::MemberJoined{
            user_id: member.user.user_id.clone(),
            username: member.user.username.clone(),
            server_id: member.server.server_id.clone(),
            role_id: member.role.role_id.clone(),
            role_name: member.role.role_name.clone(),
        }
    ).await;

    Ok(Json(member))
}
