use crate::domain::entities::channel::Channel;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Server{
    pub name: String,
    pub server_id: String,
    pub password: String,
    pub create_at: String,
    pub invite_code: String,
    pub all_channels:Vec<Channel>,
}