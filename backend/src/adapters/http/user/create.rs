use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::adapters::http::user::response::{CreateUserResponse, UserRequest};
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
    .map_err(|e| {
        let error_msg = e.to_string();
        println!("🔴 Erreur complète: {}", error_msg); // Debug log

        // Détecter les erreurs de contrainte unique
        if error_msg.contains("duplicate key") {
            if error_msg.contains("users_username_key") {
                ApiError::BadRequest("Ce nom d'utilisateur est déjà pris".to_string())
            } else if error_msg.contains("users_email_key") {
                ApiError::BadRequest("Cet email est déjà utilisé".to_string())
            } else if error_msg.contains("(email)=") {
                ApiError::BadRequest("Cet email est déjà utilisé".to_string())
            } else if error_msg.contains("(username)=") {
                ApiError::BadRequest("Ce nom d'utilisateur est déjà pris".to_string())
            } else {
                ApiError::BadRequest("Cet utilisateur existe déjà".to_string())
            }
        } else {
            ApiError::BadRequest(format!("User creation failed: {}", error_msg))
        }
    })?;

    let response = CreateUserResponse {
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        create_at: result.create_at,
        token: None,
    };

    Ok(Json(response))
}
