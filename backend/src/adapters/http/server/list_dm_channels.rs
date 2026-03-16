use axum::extract::Path;
use axum::Json;
use postgres::{Client, NoTls};

use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::constants::db_url;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::server::response::DmChannelResponse;
use crate::domain::jwt::Claims;
use crate::domain::ports::member_repository::MemberRepository;
use axum::extract::Extension;

pub async fn list_dm_channels_handler(
    Path((server_id, user_id)): Path<(String, String)>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<DmChannelResponse>>, ApiError> {
    if claims.sub != user_id {
        return Err(ApiError::Unauthorized("Cannot access DM channels for another user".to_string()));
    }

    let result = tokio::task::spawn_blocking(move || {
        if user_id.is_empty() || server_id.is_empty() {
            return Err("Missing required identifiers".to_string());
        }

        let member_repo = PostgresMemberRepo;
        member_repo.get_by_user_and_server(user_id.clone(), server_id.clone())?;

        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let rows = client
            .query(
                "SELECT cd.channel_id,
                        CASE WHEN cd.user_id = $1 THEN cd.user2_id ELSE cd.user_id END AS other_user_id,
                        u.username
                 FROM channel_dm cd
                 JOIN users u ON u.user_id = CASE WHEN cd.user_id = $1 THEN cd.user2_id ELSE cd.user_id END
                 JOIN members m ON m.user_id = CASE WHEN cd.user_id = $1 THEN cd.user2_id ELSE cd.user_id END
                 WHERE (cd.user_id = $1 OR cd.user2_id = $1)
                   AND m.server_id = $2
                 ORDER BY u.username ASC",
                &[&user_id, &server_id],
            )
            .map_err(|e| e.to_string())?;

        let channels = rows
            .into_iter()
            .map(|row| DmChannelResponse {
                channel_id: row.get(0),
                user_id: row.get(1),
                username: row.get(2),
                server_id: server_id.clone(),
            })
            .collect();

        Ok(channels)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("DM channels fetch failed: {}", e)))?;

    Ok(Json(result))
}
