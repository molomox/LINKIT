use crate::{adapters::{db::postgres_user_repository::PostgresUserRepo, http::{error::ApiError, user::response::{CreateUserResponse, LoginRequest, UserRequest}}}, domain::usecases::user::login::LoginUser};
use axum::Json;

pub async fn login_user_handler(
    Json(payload): Json<LoginRequest>,
) -> Result<Json<CreateUserResponse>, ApiError> {
    let result = tokio::task::spawn_blocking(move || {
        let repo = PostgresUserRepo;
        let usecase = LoginUser { repo: &repo };
        usecase.execute(payload.username, payload.password)
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Task failed: {}", e)))?
    .map_err(|e| ApiError::BadRequest(format!("User login failed: {}", e)))?;
    let response = CreateUserResponse {
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        create_at: result.create_at,
        token: result.token,
    };
    Ok(Json(response))
}