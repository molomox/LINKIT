use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::ban::find_by_user_and_server::UserServer;
use axum::extract::{Path, State};
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use axum::Json;
use serde::Deserialize;
use crate::domain::entities::ban::Ban;
use chrono::Utc;


pub async fn get_ban_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)):Path<(String, String)>
) ->  Result<Json<(Ban)>, ApiError> {
    let target_user_id_clone = target_user_id.clone();
    let server_id_clone = server_id.clone();

    let result = tokio::task::spawn_blocking(move || {
        let repo = crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
        let usecase = UserServer{repo: &repo};
        usecase.execute(target_user_id_clone,server_id_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to add creator as member: {}", e)))?;
    
    Ok(Json(result))
}


