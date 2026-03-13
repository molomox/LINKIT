use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Reaction{
    pub reaction_id: String,
    pub emoji: String,
    pub reaction_name: String,
}