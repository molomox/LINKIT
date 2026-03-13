use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateMessageRequest {
    pub content: String,
    pub user_id: String,
    pub is_gif: Option<bool>,
}

#[derive(Deserialize, Serialize)]
pub struct JoinServerRequest {
    pub user_id: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct UpgradeMemberRequest {
    pub server_id: String,
    pub user_id: String,
}

#[derive(Serialize)]
pub struct CreateServerResponse {
    pub server_id: String,
    pub name: String,
}

#[derive(Deserialize, Serialize)]
pub struct ToggleReactionRequest {
    pub user_id: String,
}

#[derive(Deserialize, Serialize)]
pub struct ToggleReactionResponse {
    pub status: String,
}
