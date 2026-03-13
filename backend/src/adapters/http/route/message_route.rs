use crate::adapters::websocket::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::adapters::http::message::{
    create_message::create_message_handler, delete_message::delete_message_handler,
    get_message_list::get_message_list_handler, update_message::update_message_handler,
};

pub fn message_routes(state: AppState) -> Router {
    Router::new()
        .route(
            "/channels/:channel_id/messages",
            post(create_message_handler),
        )
        .route(
            "/channels/:channel_id/messages",
            get(get_message_list_handler),
        )
        .route("/messages/:message_id", delete(delete_message_handler))
        .route("/messages/:message_id", put(update_message_handler))
        .with_state(state)
}
