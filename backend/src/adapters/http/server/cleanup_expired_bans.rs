use crate::adapters::db::postgres_ban_repository::PostgresBanRepo;
use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::domain::usecases::ban::cleanup_expired::CleanupExpiredBans;
use axum::extract::{Path, State};
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use axum::Json;

pub async fn cleanup_expired_bans_handler(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
) -> Result<Json<Vec<String>>, ApiError> {
    let server_id_clone = server_id.clone();

    let unbanned_users = tokio::task::spawn_blocking(move || {
        let ban_repo = PostgresBanRepo;
        let member_repo = PostgresMemberRepo;
        let usecase = CleanupExpiredBans {
            ban_repo: &ban_repo,
            member_repo: &member_repo,
        };
        usecase.execute(server_id_clone)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Failed to cleanup expired bans: {}", e)))?;

    // Broadcaster les changements de rôle pour chaque utilisateur débanni
    for user_id in &unbanned_users {
        state.broadcast_to_server(
            &server_id,
            WsMessage::MemberRoleChanged {
                user_id: user_id.clone(),
                username: "Utilisateur".to_string(), // On pourrait récupérer le vrai username si nécessaire
                role_id: "role02".to_string(),
                role_name: "Membre".to_string(),
                server_id: server_id.clone(),
            },
        ).await;
    }

    Ok(Json(unbanned_users))
}
