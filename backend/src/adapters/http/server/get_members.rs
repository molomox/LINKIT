use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::member::Member;
use crate::domain::usecases::server::list_member::ListServerMembers;
use axum::extract::Path;
use axum::Json;

pub async fn get_members_handler(
    Path(server_id): Path<String>,
) -> Result<Json<Vec<Member>>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMemberRepo;
        let usecase = ListServerMembers { repo: &repo };
        usecase.execute(server_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server members fetching failed: {}", e)))?;

    Ok(Json(result))
}
