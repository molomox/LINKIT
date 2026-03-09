use crate::adapters::db::postgres_member_repository::PostgresMemberRepo;
use crate::adapters::http::server::response::UpgradeMemberRequest;
use crate::domain::entities::member::Member;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::server::list_member::ListServerMembers;
use crate::domain::usecases::server::update_member::UpdateMemberRole;
use axum::Json;
use axum::extract::Path;
use axum::extract::State;
use crate::adapters::websocket::WsMessage;
use crate::adapters::http::server::state::AppState;


pub async fn update_members_handler(
    State(state): State<AppState>,
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

    let user_id_clone = upgrade_member_request.user_id.clone();
    let server_id_clone = upgrade_member_request.server_id.clone();
    let role_id_clone = role_id.clone();

    let member_info = tokio::task::spawn_blocking(move || {
        use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
        use crate::domain::ports::user_repository::UserRepository;
        use crate::adapters::db::postgres_role_repository::PostgresRoleRepo;
        use crate::domain::ports::role_repository:RoleRepository;

        let user_repo = PostgresUserRepo;
        let role_repo = PostgresRoleRepo;

        let user = user_repo.find_by_id(user_id_clone)?;
        let role = role_repo.find_by_id(role_id_clone)?;
        Ok::<_, String>((user.usernamen role.role_name))
    }).await

    if let Ok(Ok((username, role_name))) = member_info {
        state.broadcast_to_server(
            &upgrade_member_request.server_id,
            WsMessage::MemberRoleUpdated{
                user_id: upgrade_member_request.user_id.clone(),
                username,
                server_id: upgrade_member_request.server_id.clone(),
                role_id: role_id.clone(),
                role_name,
            }
        ).await
    }

    Ok(Json(result))
}
