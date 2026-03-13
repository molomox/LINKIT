use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Reaction{
    pub reaction_id: i32,
    pub emoji: String,
    pub reaction_name: String,
}