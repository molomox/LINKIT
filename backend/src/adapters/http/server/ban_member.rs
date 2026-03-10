use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::server::ban::save::CreateBan;
use axum::extract::{Path, State};
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
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
) ->  Result<Json<(String)>, ApiError> {
    let banner_user_id = payload.banner_user_id.clone();
    let reason = payload.reason.clone();
    let expired_at = payload.expired_at.clone();
    let target_user_id_clone = target_user_id.clone();
    let server_id_clone = server_id.clone();

    tokio::task::spawn_blocking(move || {
        let repo = PostgresBanRepo;
        let member_repo = PostgresMemberRepo;
        let user_repo = PostgresUserRepo;
        let usecase = CreateBan{&repo,&member_repo,&user_repo};
        usecase.execute(target_user_id_clone,server_id_clone,reason,banner_user_id,expired_at)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to add creator as member: {}", e)))?;
    
    Ok(Json("le membre a été bannis"));
};


