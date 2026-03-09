use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::user::response::{UserRequest, CreateUserResponse};
use crate::domain::usecases::user::create::CreateUser;
use axum::Json;

pub async fn create_user_handler(
    Json(payload): Json<UserRequest>,
) -> Result<Json<CreateUserResponse>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresUserRepo;
        let usecase = CreateUser { repo: &repo };
        usecase.execute(payload.username, payload.password, payload.email)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("User creation failed: {}", e)))?;
    let response = CreateUserResponse {
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        create_at: result.create_at,
    };

    Ok(Json(response))
}