
use serde::{Serialize, Deserialize};

#[derive(Deserialize, Serialize)]
pub struct CreateServerRequest{
    pub user_id: String,
    pub name: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct JoinServerRequest{
    pub user_id: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct UpgradeMemberRequest{
    pub server_id: String,
    pub user_id: String,
}


#[derive(Serialize)]
pub struct CreateServerResponse{
    pub server_id: String,
    pub name: String,
}
