use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::usecases::user::logout::LogoutUser;
use axum::extract::Query;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UserIdQuery {
    pub user_id: String,
}

pub async fn logout_user_handler(Query(query): Query<UserIdQuery>) -> Result<(), ApiError> {
    let user_id = query.user_id;
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
