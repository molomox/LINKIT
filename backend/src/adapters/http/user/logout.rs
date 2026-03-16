use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::domain::jwt::Claims;
use axum::extract::Extension;

pub async fn logout_user_handler(
    Extension(claims): Extension<Claims>,
) -> Result<(), ApiError> {
    let user_id = claims.sub;
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresUserRepo;
        let usecase = LogoutUser { repo: &repo };
        usecase.execute(user_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("User logout failed: {}", e)))?;

    Ok(result)
}
