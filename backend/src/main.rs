use mongodb::{ 
    bson::{Document, doc},
    Client,
    Collection 
};
use axum::http::{
    header::{AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use axum::Router;
use std::env;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

pub mod adapters;
pub mod domain;

// Importation des routes
use backend::adapters::http::route::channels_route::channels_routes;
use backend::adapters::http::route::message_route::message_routes;
use backend::adapters::http::route::server_route::server_routes;
use backend::adapters::http::route::user_route::user_routes;
use backend::adapters::websocket::{websocket_routes, AppState};

fn load_env_files() {
    // Load common paths so `cargo run` works from backend/ or repo root.
    let _ = dotenvy::from_filename(".env");
    let _ = dotenvy::from_filename("backend/.env");
    let _ = dotenvy::from_filename("../.env");
}

#[tokio::main]
async fn main() {
    load_env_files();

    // 0. Charger les variables d'environnement
    let frontend_url = env::var("FRONTEND_URL")
        .expect("❌ FRONTEND_URL n'est pas défini - Vérifiez votre fichier .env");
    let port = env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .expect("PORT doit être un nombre valide");
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());

    // Vérifier que JWT_SECRET est défini au démarrage
    let _ = env::var("JWT_SECRET")
        .expect("❌ JWT_SECRET n'est pas défini - Le serveur ne peut pas démarrer sans JWT_SECRET dans .env");

    // 1. Créer l'état partagé pour les WebSockets
    let ws_state = AppState::new();

    // 2. Configurer le CORS - Accepter plusieurs origins pour développement
    let allowed_origins = vec![
        "http://localhost:3001".parse::<HeaderValue>().unwrap(),
        "http://127.0.0.1:3001".parse::<HeaderValue>().unwrap(),
        frontend_url
            .parse::<HeaderValue>()
            .expect("FRONTEND_URL doit être une URL valide"),
    ];

    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::DELETE,
            Method::PUT,
            Method::OPTIONS,
        ])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION]);

    // 3. Assembler les routes
    let app = Router::new()
        .merge(server_routes(ws_state.clone()))
        .merge(user_routes())
        .merge(channels_routes(ws_state.clone()))
        .merge(message_routes(ws_state.clone()))
        .merge(websocket_routes(ws_state))
        .fallback(|| async {
            (
                axum::http::StatusCode::NOT_FOUND,
                "Route non trouvée dans Axum",
            )
        })
        .layer(cors);

    // 4. Parser l'adresse
    let addr: SocketAddr = format!("{}:{}", host, port)
        .parse()
        .expect("Adresse invalide");

    println!("🚀 Backend Rust lancé sur http://{}:{}", host, port);
    println!("🔐 JWT_SECRET configuré ✓");
    println!("🌐 CORS autorisé pour : {}", frontend_url);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|_| panic!("❌ Erreur: Le port {} est déjà utilisé. Tuez le processus avec: lsof -ti:{} | xargs kill -9", port, port));

    axum::serve(listener, app).await.unwrap();
}
