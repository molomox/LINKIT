use axum::{middleware, Router, routing::{delete, get, post,put}};
use crate::adapters::websocket::AppState;
use crate::adapters::http::auth::middleware::require_auth;

use crate::adapters::http::{
    channel::create_channel::create_channel_handler,
    channel::delete_channel::delete_channel_handler, channel::get_channel::get_channel_handler,
    channel::list_channel::list_channel_handler, channel::update_channel::update_channel_handler,
};

pub fn channels_routes(state: AppState) -> Router {
    Router::new()
        .route("/servers/:server_id/channels", post(create_channel_handler))
        .route("/servers/:server_id/channels", get(list_channel_handler))
        .route("/channels/:channel_id", get(get_channel_handler))
        .route("/channels/:channel_id", put(update_channel_handler))
        .route("/channels/:channel_id", delete(delete_channel_handler))
        .route_layer(middleware::from_fn(require_auth))
        .with_state(state)
}
