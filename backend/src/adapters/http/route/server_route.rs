use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::adapters::http::server::{
    ban_member::ban_member_handler, cleanup_expired_bans::cleanup_expired_bans_handler,
    create_server::create_server_handler, deban::deban_member_handler,
    delete_server::delete_server_handler, find_ban_by_id::get_ban_handler,
    find_by_user_id::get_user_server_handler, get_members::get_members_handler,
    get_server::get_server_handler, join_by_invite::join_server_by_invite_handler,
    join_server::join_server_handler, kick_member::kick_member_handler,
    leave_server::delete_member_handler,
    update_ban_member::update_ban_member_handler as update_ban_handler,
    update_member::update_members_handler, update_server::update_server_handler,
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
        .route(
            "/servers/:server_id/members/:user_id",
            put(update_members_handler),
        )
        .route(
            "/servers/:server_id/members/:user_id/kick",
            delete(kick_member_handler),
        )
        .route(
            "/servers/:server_id/members/:user_id/ban",
            post(ban_member_handler),
        )
        .route(
            "/servers/:server_id/members/:user_id/deban",
            delete(deban_member_handler),
        )
        .route(
            "/servers/:server_id/members/:user_id/update_ban",
            put(update_ban_handler),
        )
        .route(
            "/servers/:server_id/members/:user_id/get_ban",
            get(get_ban_handler),
        )
        .route(
            "/servers/:server_id/cleanup-bans",
            post(cleanup_expired_bans_handler),
        )
        .route("/invite/:invite_code", post(join_server_by_invite_handler))
        .with_state(state)
}
