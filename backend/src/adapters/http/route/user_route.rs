use axum::{middleware, Router, routing::{delete, get, post}};

use crate::adapters::http::user::{
    create::create_user_handler as create_user_handler,
    login::login_user_handler as login_user_handler,
    logout::logout_user_handler as logout_user_handler,
    get_by_id::get_user_handler as get_user_handler
};
use crate::adapters::http::auth::middleware::require_auth;

pub fn user_routes() -> Router {
    let public_routes = Router::new()
        .route("/auth/signup", post(create_user_handler))
        .route("/user/login", post(login_user_handler));

    let protected_routes = Router::new()
        .route("/auth/logout", post(logout_user_handler))
        .route("/me", get(get_user_handler))
        .route_layer(middleware::from_fn(require_auth));

    public_routes.merge(protected_routes)
}
