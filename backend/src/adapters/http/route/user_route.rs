use axum::{
    routing::{delete, get, post},
    Router,
};

use crate::adapters::http::user::{
    create::create_user_handler, get_by_id::get_user_handler, login::login_user_handler,
    logout::logout_user_handler,
};

pub fn user_routes() -> Router {
    Router::new()
        .route("/auth/signup", post(create_user_handler))
        .route("/user/login", post(login_user_handler))
        .route("/auth/logout", post(logout_user_handler))
        .route("/me", get(get_user_handler))
}
