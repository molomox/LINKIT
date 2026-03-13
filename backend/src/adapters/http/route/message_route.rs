use axum::{Router, routing::{delete, get, post, put}};
use crate::adapters::websocket::AppState;

use crate::adapters::http::message::{
    create_message::create_message_handler as create_message_handler, 
    get_message_list::get_message_list_handler as get_message_list_handler,
    delete_message::delete_message_handler as delete_message_handler,
    update_message::update_message_handler as update_message_handler,
    manage_reaction::manage_reaction_handler as manage_reaction_handler,
};

pub fn message_routes(state: AppState) -> Router {
    Router::new()
        .route("/channels/:channel_id/messages", post(create_message_handler))
        .route("/channels/:channel_id/messages", get(get_message_list_handler))
        .route("/messages/:message_id", delete(delete_message_handler))
        .route("/messages/:message_id", put(update_message_handler))
        .route("/messages/:message_id/reaction", post(manage_reaction_handler))
        .with_state(state)
}