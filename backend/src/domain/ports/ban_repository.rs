use crate ::domain::entities::ban::Ban;


pub trait BanRepository{
    fn save(&self, ban: Ban)-> Result<Ban, String>;
    fn deban(&self, user_id: String, server_id: String) -> Result<String, String>;
    fn find_by_user_and_server(&self, user_id: String, server_id: String) -> Result<Ban, String>;
    fn update_ban(&self, user_id: String, server_id: String, reason: String, expired_at: String,) -> Result<String,String>;
}