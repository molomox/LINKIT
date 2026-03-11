
use serde::{Serialize, Deserialize};

#[derive(Deserialize, Serialize)]
pub struct UserRequest{
    pub username: String,
    pub password: String,
    pub email: String,
}

#[derive(Deserialize, Serialize)]
pub struct LoginRequest{
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct CreateUserResponse{
    pub user_id: String,
    pub username: String,
    pub email: String,
    pub create_at: String,
    pub token: Option<String>,
}
