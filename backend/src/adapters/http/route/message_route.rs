use crate::adapters::websocket::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};


use crate::adapters::http::message::{
    create_message::create_message_handler as create_message_handler, 
    get_message_list::get_message_list_handler as get_message_list_handler,
    delete_message::delete_message_handler as delete_message_handler,
    update_message::update_message_handler as update_message_handler,
    get_reactions::get_reactions_handler as get_reactions_handler,
    toggle_reaction::toggle_reaction_handler as toggle_reaction_handler,

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
        .route("/reactions", get(get_reactions_handler))
        .route("/messages/:message_id/reactions/:reaction_id", put(toggle_reaction_handler))
        .with_state(state)
}
