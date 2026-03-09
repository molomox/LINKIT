// Modules WebSocket
mod types;
mod state;
mod channel_handler;
mod server_handler;

// Réexporter les types publics
pub use types::{IncomingWsMessage, WsMessage};
pub use state::{AppState, Clients};

use axum::{
    extract::{
        ws::WebSocketUpgrade,
        Path, State,
    },
    response::Response,
    routing::get,
    Router,
};

/// Route WebSocket pour un channel spécifique
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(channel_id): Path<String>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| channel_handler::handle_socket(socket, channel_id, state))
}

/// Route WebSocket pour un serveur (pour les événements de canaux et membres)
pub async fn ws_server_handler(
    ws: WebSocketUpgrade,
    Path(server_id): Path<String>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| server_handler::handle_server_socket(socket, server_id, state))
}

// Router WebSocket
pub fn websocket_routes(state: AppState) -> Router {
    Router::new()
        .route("/ws/channels/:channel_id", get(ws_handler))
        .route("/ws/servers/:server_id", get(ws_server_handler))
        .with_state(state)
}
