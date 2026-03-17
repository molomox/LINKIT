use crate::domain::ports::ban_repository::BanRepository;

pub struct MockBanRepository;

impl MockBanRepository {
    pub fn new() -> Self {
        MockBanRepository
    }
}

impl BanRepository for MockBanRepository {
    fn save(&self, _ban: crate::domain::entities::ban::Ban) -> Result<crate::domain::entities::ban::Ban, String> {
        Err("Not implemented".to_string())
    }
    fn deban(&self, _user_id: String, _server_id: String) -> Result<String, String> {
        Err("Not implemented".to_string())
    }
    fn find_by_user_and_server(&self, _user_id: String, _server_id: String) -> Result<crate::domain::entities::ban::Ban, String> {
        Err("Not implemented".to_string())
    }
    fn find_by_server(&self, _server_id: String) -> Result<Vec<crate::domain::entities::ban::Ban>, String> {
        Err("Not implemented".to_string())
    }
    fn update_ban(&self, _user_id: String, _server_id: String, _reason: String, _expired_at: String) -> Result<String, String> {
        Err("Not implemented".to_string())
    }
}
