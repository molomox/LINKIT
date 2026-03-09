use crate::domain::entities::{role::Role, server::Server, user::User};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Member {
    pub user: User,
    pub server: Server,
    pub role: Role,
    pub join_at: String,
}