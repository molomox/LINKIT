use crate::domain::entities::message::Message;
use crate::domain::entities::reaction::Reaction;
use crate::domain::entities::user::User;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Reagi {
    pub message: Message,
    pub user: User,
    pub reaction: Reaction,
}
