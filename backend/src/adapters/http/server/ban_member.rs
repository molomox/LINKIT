use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::ban::save::CreateBan;
use axum::extract::{Path, State};
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::adapters::http::server::response::BanMemberRequest as OtherBanMemberRequest;
use axum::Json;
use serde::Deserialize;
use crate::domain::entities::ban::Ban;
use chrono::Utc;
#[derive(Deserialize)]
pub struct BanMemberRequest {
    pub banner_user_id: String,
    pub reason: String,
    pub expired_at: String,
}

pub async fn ban_member_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)):Path<(String, String)>,
    Json(payload): Json<BanMemberRequest>,
) ->  Result<Json<Ban>, ApiError> {
    let banner_user_id = payload.banner_user_id;
    let reason = payload.reason;
    let expired_at = payload.expired_at;
    let expired_at_clone = expired_at.clone();
    let banner_user_id_clone = banner_user_id.clone();
    let reason_clone = reason.clone();
    let server_id_clone = server_id.clone();
    let target_user_id_clone = target_user_id.clone();

    tokio::task::spawn_blocking(move || {
        let repo = PostgresBanRepo;
        let member_repo = PostgresMemberRepo;
        let user_repo = PostgresUserRepo;
        let usecase = CreateBan{repo:&repo,member_repo:&member_repo,user_repo:&user_repo};
        usecase.execute(target_user_id_clone,server_id_clone,reason_clone,banner_user_id_clone,expired_at_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to add creator as member: {}", e)))?;

    let ban = Ban {
        ban_id: "".to_string(),
        bannished_user_id: target_user_id,
        server_id: server_id,
        reason: reason,
        banned_by_user_id: banner_user_id,
        expired_at: expired_at,
        create_at: Utc::now().to_string(),
    };
    return Ok(Json(ban));
}


