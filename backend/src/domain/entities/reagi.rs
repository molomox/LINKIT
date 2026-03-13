use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Reagi{
    pub message: Message,
    pub user: User,
    pub reaction: Reaction,
}