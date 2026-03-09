use axum::{Router, routing::{delete, get, post,put}};

use crate::adapters::http::message::{create_message::create_message_handler as create_message_handler, 
    get_message_list::get_message_list_handler as get_message_list_handler,
    delete_message::delete_message_handler as delete_message_handler
};

pub fn message_routes() -> Router {
    Router::new()
        .route("/channels/:channel_id/messages", post(create_message_handler))
        .route("/channels/:channel_id/messages", get(get_message_list_handler))
        .route("/messages/:message_id", delete(delete_message_handler))
}