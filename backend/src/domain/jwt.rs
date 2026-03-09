use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};
use std::env;

fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| {
        eprintln!("⚠️  WARNING: JWT_SECRET non défini, utilisation d'un secret par défaut (DÉVELOPPEMENT UNIQUEMENT)");
        "dev_secret_change_me_in_production".to_string()
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,      // user_id
    pub username: String,
    pub exp: usize,       // Expiration timestamp
}

/// Génère un token JWT pour un utilisateur
pub fn generate_token(user_id: &str, username: &str) -> Result<String, String> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24)) // Token valide 24h
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp: expiration as usize,
    };

    let secret = get_jwt_secret();
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| format!("Erreur lors de la génération du token: {}", e))
}

/// Valide un token JWT et retourne les claims
pub fn validate_token(token: &str) -> Result<Claims, String> {
    let secret = get_jwt_secret();
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .map_err(|e| format!("Token invalide: {}", e))
}
