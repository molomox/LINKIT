use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::ban::deban::Deban;
use axum::extract::{Path, State};
use axum::Json;
use chrono::Utc;
use serde::Deserialize;

pub async fn deban_member_handler(
    State(state): State<AppState>,
    Path((server_id, target_user_id)): Path<(String, String)>,
) -> Result<Json<String>, ApiError> {
    let target_user_id_clone = target_user_id.clone();
    let target_user_id_for_username = target_user_id.clone();
    let server_id_clone = server_id.clone();

    tokio::task::spawn_blocking(move || {
        let repo = crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
        let member_repo = PostgresMemberRepo;
        let usecase = Deban {
            repo: &repo,
            member_repo: &member_repo,
        };
        usecase.execute(target_user_id_clone, server_id_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to deban member: {}", e)))?;

    // Broadcaster l'événement member_role_changed pour mettre à jour l'interface
    let username = tokio::task::spawn_blocking(move || {
        let user_repo = PostgresUserRepo;
        user_repo
            .find_by_id(target_user_id_for_username)
            .map(|user| user.username)
            .unwrap_or_else(|_| "Utilisateur".to_string())
    })
    .await
    .unwrap_or_else(|_| "Utilisateur".to_string());

    state
        .broadcast_to_server(
            &server_id,
            WsMessage::MemberRoleChanged {
                user_id: target_user_id,
                username,
                role_id: "role02".to_string(),
                role_name: "Membre".to_string(),
                server_id: server_id.clone(),
            },
        )
        .await;

    Ok(Json("Le membre a été débanni".to_string()))
}
