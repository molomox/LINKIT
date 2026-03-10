use axum::{Router, routing::{delete, get, post,put}};

use crate::adapters::http::server::{
    create_server::create_server_handler as create_server_handler, 
    delete_server::delete_server_handler as delete_server_handler, 
    find_by_user_id::get_user_server_handler as get_user_server_handler, 
    get_members::get_members_handler as get_members_handler, 
    get_server::get_server_handler as get_server_handler, 
    join_server::join_server_handler as join_server_handler, 
    leave_server::delete_member_handler as delete_member_handler,
    update_member::update_members_handler as update_members_handler,
    update_server::update_server_handler as update_server_handler,
    join_by_invite::join_server_by_invite_handler as join_server_by_invite_handler,
    kick_member::kick_member_handler as kick_member_handler
};
use crate::adapters::websocket::AppState;

pub fn server_routes(state: AppState) -> Router {
    Router::new()
        .route("/servers", post(create_server_handler))
        .route("/servers", get(get_user_server_handler))
        .route("/servers/:server_id", get(get_server_handler))
        .route("/servers/:server_id", delete(delete_server_handler))
        .route("/servers/:server_id", put(update_server_handler))

        .route("/servers/:server_id/join", post(join_server_handler))
        .route("/servers/:server_id/leave", delete(delete_member_handler))
        .route("/servers/:server_id/members", get(get_members_handler))
        .route("/servers/:server_id/members/:user_id", put(update_members_handler))

        .route("/servers/:server_id/members/:user_id/kick", delete(kick_member_handler))
        .route("/servers/:server_id/members/:user_id/ban", post(ban_member_handler))
        .route("/servers/:server_id/members/:user_id/deban", delete(deban_member_handler))
        .route("/servers/:server_id/members/:user_id/update_ban", put(update_ban_handler))
        .route("/servers/:server_id/members/:user_id/get_ban", get(get_ban_handler))

        .route("/invite/:invite_code", post(join_server_by_invite_handler))
        .with_state(state)
}
