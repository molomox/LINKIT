use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::ban::deban::Deban;
use axum::extract::{Path, State};
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use axum::Json;
use serde::Deserialize;
use crate::domain::entities::ban::Ban;
use chrono::Utc;


pub async fn deban_member_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)):Path<(String, String)>
) ->  Result<Json<(String)>, ApiError> {
    let target_user_id_clone = target_user_id.clone();
    let server_id_clone = server_id.clone();

    tokio::task::spawn_blocking(move || {
        let repo = PostgresBanRepo;
        let usecase = Deban{repo: &repo};
        usecase.execute(target_user_id_clone,server_id_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to add creator as member: {}", e)))?;
    
    return Ok(Json("le membre a été bannis".to_string()));
}


