use crate::domain::entities::user::User;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Message{
    pub message_id:String,
    pub channel_id: String,
    pub content: String,
    pub user: User,
    pub create_at: String,
}