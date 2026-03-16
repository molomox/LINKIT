use axum::{http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub enum ApiError {
    BadRequest(String),
    NotFound(String),
    Unauthorized(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg).into_response(),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg).into_response(),
            ApiError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg).into_response(),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response(),
        }
    }
}
