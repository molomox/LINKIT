use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::websocket::{AppState, WsMessage};
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::usecases::server::leave::LeaveServer;
use axum::extract::{Path, State};
use axum::Json;

pub async fn delete_member_handler(
    State(state): State<AppState>,
    Path(server_id): Path<String>,
    Json(user_id): Json<String>,
) -> Result<Json<()>, ApiError> {
    let member_result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMemberRepo;

        let members = repo
            .find_by_server_id(server_id.clone())
            .map_err(|e| e.to_string())?;

        let username = members
            .into_iter()
            .find(|member| member.user.user_id == user_id)
            .map(|member| member.user.username)
            .ok_or_else(|| "Membre introuvable".to_string())?;

        let usecase = LeaveServer { repo: &repo };
        usecase
            .execute(user_id.clone(), server_id.clone())
            .map_err(|e| e.to_string())?;

        Ok::<(String, String, String), String>((user_id, server_id, username))
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server leaving failed: {}", e)))?;

    let (user_id, server_id, username) = member_result;
    state
        .broadcast_to_server(
            &server_id,
            WsMessage::UserLeft {
                user_id,
                username,
                server_id: server_id.clone(),
            },
        )
        .await;

    Ok(Json(()))
}
