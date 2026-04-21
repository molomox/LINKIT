use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
use crate::adapters::db::postgres_server_repository::PostgresServerRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::entities::member::Member;
use crate::domain::usecases::server::join_by_invite::JoinServerByInvite;
use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct JoinByInviteRequest {
    pub user_id: String,
}

pub async fn join_server_by_invite_handler(
    State(state): State<AppState>,
    Path(invite_code): Path<String>,
    Json(request): Json<JoinByInviteRequest>,
) -> Result<Json<Member>, ApiError> {
    let member_result: Result<Result<Member, String>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        let repo = PostgresServerRepo;
        let repo2 = PostgresMemberRepo;
        let repo3 = PostgresRoleRepo;
        let ban_repo = PostgresBanRepo;
        let usecase = JoinServerByInvite {
            repo: &repo,
            repo2: &repo2,
            repo3: &repo3,
            ban_repo: &ban_repo,
        };
        usecase.execute(request.user_id, invite_code.clone(), "role02".to_string())
    }).await;
    let member = member_result
        .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
        .map_err(|e| ApiError::BadRequest(format!("Server joining by invite failed: {}", e)))?;
    state
        .broadcast_to_server(
            &member.server.server_id,
            WsMessage::MemberJoined {
                user_id: member.user.user_id.clone(),
                username: member.user.username.clone(),
                server_id: member.server.server_id.clone(),
                role_id: member.role.role_id.clone(),
                role_name: member.role.role_name.clone(),
            },
        )
        .await;

    Ok(Json(member))
}
