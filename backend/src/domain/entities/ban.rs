use serde ::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Ban{
    pub user_id: String,
    pub server_id: String,
    pub reason: String,
    pub create_at: String
}