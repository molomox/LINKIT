use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Role {
    pub role_id: String,
    pub role_name: String,
}
