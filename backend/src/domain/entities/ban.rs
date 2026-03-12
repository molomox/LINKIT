use serde ::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[derive(Debug)]
pub struct Ban{
    pub ban_id: String,
    pub bannished_user_id: String,
    pub server_id: String,
    pub banned_by_user_id: String,
    pub reason: String,
    pub create_at: String,
    pub expired_at: String,
}