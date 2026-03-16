use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::user::User;
use crate::domain::usecases::user::find_by_id::GetUserById;
use crate::domain::jwt::Claims;
use axum::extract::Extension;

pub async fn get_user_handler(
    Extension(claims): Extension<Claims>,
) -> Result<axum::Json<User>, ApiError> {
    let user_id = claims.sub;
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresUserRepo;
        let usecase = GetUserById { repo: &repo };
        usecase.execute(user_id)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("User retrieval failed: {}", e)))?;

    Ok(axum::Json(result))
}
