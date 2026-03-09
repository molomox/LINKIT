use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct User {
    pub user_id: String,
    pub username: String,
    pub password: String,
    pub email: String,
    pub create_at: String,
    pub token: Option<String>,
}