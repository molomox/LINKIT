use axum::Router;
use axum::http::{header::CONTENT_TYPE, Method, HeaderValue};
use tower_http::cors::CorsLayer;
use std::net::SocketAddr;

pub mod domain;
pub mod adapters;

// Importation des routes
use backend::adapters::http::route::server_route::server_routes;
use backend::adapters::http::route::user_route::user_routes;
use backend::adapters::http::route::message_route::message_routes;
use backend::adapters::http::route::channels_route::channels_routes;
use backend::adapters::websocket::{websocket_routes, AppState};

#[tokio::main]
async fn main() {
    // 1. Créer l'état partagé pour les WebSockets
    let ws_state = AppState::new();

    // 2. Configurer le CORS
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3001".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::PUT, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE]);

    // 3. Assembler les routes
    let app = Router::new()
        .merge(server_routes(ws_state.clone()))
        .merge(user_routes())
        .merge(channels_routes(ws_state.clone()))
        .merge(message_routes(ws_state.clone()))
        .merge(websocket_routes(ws_state))
        .fallback(|| async {
            (axum::http::StatusCode::NOT_FOUND, "Route non trouvée dans Axum")
        })
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Backend Rust lancé sur http://0.0.0.0:3000");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("❌ Erreur: Le port 3000 est déjà utilisé. Tuez le processus avec: lsof -ti:3000 | xargs kill -9");

    axum::serve(listener, app).await.unwrap();
}