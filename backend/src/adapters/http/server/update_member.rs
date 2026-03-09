use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::server::response::UpgradeMemberRequest;
use crate::domain::entities::member::Member;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::server::list_member::ListServerMembers;
use crate::domain::usecases::server::update_member::UpdateMemberRole;
use axum::Json;
use axum::extract::Path;

pub async fn update_members_handler(
    Path(upgrade_member_request): Path<UpgradeMemberRequest>,
    Json(role_id): Json<String>,

) -> Result<Json<String>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresMemberRepo;
        let usecase = UpdateMemberRole { repo: &repo };
        usecase.execute(upgrade_member_request.user_id, upgrade_member_request.server_id, role_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("Server members updating failed: {}", e)))?;

    Ok(Json(result))
}
