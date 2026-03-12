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
use crate::adapters::http::server::response::BanMemberRequest;
use axum::Json;
use serde::Deserialize;
use crate::domain::entities::ban::Ban;
use chrono::Utc;

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

    let ban = tokio::task::spawn_blocking(move || {
        let repo = PostgresBanRepo;
        let member_repo = PostgresMemberRepo;
        let user_repo = PostgresUserRepo;
        let usecase = CreateBan{
            repo: &repo,
            member_repo: &member_repo,
            user_repo: &user_repo,
        };
        usecase.execute(target_user_id_clone,server_id_clone,reason_clone,banner_user_id_clone,expired_at_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to ban member: {}", e)))?;

    // Récupérer le username de l'utilisateur banni
    let username = tokio::task::spawn_blocking(move || {
        let user_repo = PostgresUserRepo;
        user_repo.find_by_id(target_user_id.clone())
            .map(|user| user.username)
            .unwrap_or_else(|_| "Utilisateur".to_string())
    })
    .await
    .unwrap_or_else(|_| "Utilisateur".to_string());

    // Broadcaster le bannissement à tous les membres du serveur
    state.broadcast_to_server(
        &server_id,
        WsMessage::MemberBanned {
            user_id: ban.bannished_user_id.clone(),
            username,
            server_id: server_id.clone(),
            reason: ban.reason.clone(),
        },
    ).await;
    
    Ok(Json(ban))
}


