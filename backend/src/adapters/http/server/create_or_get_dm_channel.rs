use axum::extract::Path;
use axum::Json;
use postgres::{Client, NoTls};
use uuid::Uuid;

use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::constants::db_url;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::{CreateDmChannelRequest, DmChannelResponse};
use crate::domain::ports::member_repository::MemberRepository;

pub async fn create_or_get_dm_channel_handler(
    Path((server_id, target_user_id)): Path<(String, String)>,
    Json(request): Json<CreateDmChannelRequest>,
) -> Result<Json<DmChannelResponse>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        if request.user_id.is_empty() || target_user_id.is_empty() || server_id.is_empty() {
            return Err("Missing required identifiers".to_string());
        }

        if request.user_id == target_user_id {
            return Err("Cannot create private channel with yourself".to_string());
        }

        let member_repo = PostgresMemberRepo;
        member_repo.get_by_user_and_server(request.user_id.clone(), server_id.clone())?;
        member_repo.get_by_user_and_server(target_user_id.clone(), server_id.clone())?;

        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let existing = client
            .query_opt(
                "SELECT channel_id FROM channel_dm \
                 WHERE (user_id = $1 AND user2_id = $2) OR (user_id = $2 AND user2_id = $1) \
                 LIMIT 1",
                &[&request.user_id, &target_user_id],
            )
            .map_err(|e| e.to_string())?;

        let channel_id = if let Some(row) = existing {
            row.get::<usize, String>(0)
        } else {
            let new_id = Uuid::new_v4().to_string();
            client
                .execute(
                    "INSERT INTO channel_dm (channel_id, user_id, user2_id) VALUES ($1, $2, $3)",
                    &[&new_id, &request.user_id, &target_user_id],
                )
                .map_err(|e| e.to_string())?;
            new_id
        };

        let target_row = client
            .query_one("SELECT username FROM users WHERE user_id = $1", &[&target_user_id])
            .map_err(|e| e.to_string())?;

        Ok(DmChannelResponse {
            channel_id,
            server_id,
            user_id: target_user_id,
            username: target_row.get(0),
        })
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("DM channel creation failed: {}", e)))?;

    Ok(Json(result))
}
