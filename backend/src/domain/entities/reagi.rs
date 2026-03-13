use serde::{Deserialize, Serialize};
use crate::domain::entities::message::Message;
use crate::domain::entities::user::User;
use crate::domain::entities::reaction::Reaction;

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Reagi{
    pub message: Message,
    pub user: User,
    pub reaction: Reaction,
}