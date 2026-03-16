use axum::extract::Request;
use axum::http::header::AUTHORIZATION;
use axum::middleware::Next;
use axum::response::Response;

use crate::adapters::db::postgres_user_repository::PostgresUserRepo;
use crate::adapters::http::error::ApiError;
use crate::domain::jwt::{validate_token, Claims};
use crate::domain::ports::user_repository::UserRepository;

pub async fn require_auth(mut request: Request, next: Next) -> Result<Response, ApiError> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| ApiError::Unauthorized("Missing Authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ApiError::Unauthorized("Invalid Authorization format".to_string()))?
        .trim()
        .to_string();

    if token.is_empty() {
        return Err(ApiError::Unauthorized("Empty bearer token".to_string()));
    }

    let claims = validate_token(&token)
        .map_err(|e| ApiError::Unauthorized(format!("Invalid token: {}", e)))?;

    let user_id = claims.sub.clone();
    let token_for_check = token.clone();

    tokio::task::spawn_blocking(move || {
        let repo = PostgresUserRepo;
        let user = repo.find_by_id(user_id)?;
        match user.token {
            Some(stored) if stored == token_for_check => Ok(()),
            _ => Err("Token revoked or does not match active session".to_string()),
        }
    })
    .await
    .map_err(|e| ApiError::InternalError(format!("Auth task failed: {}", e)))?
    .map_err(ApiError::Unauthorized)?;

    request.extensions_mut().insert::<Claims>(claims);

    Ok(next.run(request).await)
}
