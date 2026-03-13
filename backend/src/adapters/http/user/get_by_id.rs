use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::entities::user::User;
use crate::domain::usecases::user::find_by_id::GetUserById;
use axum::extract::Query;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UserIdQuery {
    pub user_id: String,
}

pub async fn get_user_handler(
    Query(query): Query<UserIdQuery>,
) -> Result<axum::Json<User>, ApiError> {
    let user_id = query.user_id;
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
