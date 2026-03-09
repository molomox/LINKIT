use crate::domain::entities::message::Message;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Channel{
    pub channel_id: String,
    pub server_id: String,
    pub name: String,
    pub create_at: String
}