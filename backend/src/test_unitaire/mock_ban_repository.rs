use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use std::sync::{Arc, Mutex};

pub struct MockBanRepository {
    bans: Arc<Mutex<Vec<Ban>>>,
}

impl MockBanRepository {
    pub fn new() -> Self {
        Self {
            bans: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn create_test_ban(&self, ban_id: &str, user_id: &str, server_id: &str, reason: &str, banned_by_user_id: &str, expired_at: &str) -> Ban {
        Ban {
            ban_id: ban_id.to_string(),
            bannished_user_id: user_id.to_string(),
            server_id: server_id.to_string(),
            reason: reason.to_string(),
            banned_by_user_id: banned_by_user_id.to_string(),
            expired_at: expired_at.to_string(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }
    pub fn add_ban(&self, ban: Ban) {
        self.bans.lock().unwrap().push(ban);
    }
}

impl BanRepository for MockBanRepository {
    fn save(&self, ban: Ban) -> Result<Ban, String> {
        self.bans.lock().unwrap().push(ban.clone());
        Ok(ban)
    }
    fn deban(&self, user_id: String, server_id: String) -> Result<String, String> {
        let mut bans = self.bans.lock().unwrap();
        let len_before = bans.len();
        bans.retain(|b| !(b.bannished_user_id == user_id && b.server_id == server_id));
        if bans.len() < len_before {
            Ok(format!("{}:{}", user_id, server_id))
        } else {
            Err("Ban not found".to_string())
        }
    }
    fn find_by_user_and_server(&self, user_id: String, server_id: String) -> Result<Ban, String> {
        let bans = self.bans.lock().unwrap();
        bans.iter()
            .find(|b| b.bannished_user_id == user_id && b.server_id == server_id)
            .cloned()
            .ok_or_else(|| "Ban not found".to_string())
    }
    fn find_by_server(&self, server_id: String) -> Result<Vec<Ban>, String> {
        let bans = self.bans.lock().unwrap();
        Ok(bans.iter().filter(|b| b.server_id == server_id).cloned().collect())
    }
    fn update_ban(&self, user_id: String, server_id: String, reason: String, expired_at: String) -> Result<String, String> {
        let mut bans = self.bans.lock().unwrap();
        if let Some(ban) = bans.iter_mut().find(|b| b.bannished_user_id == user_id && b.server_id == server_id) {
            ban.reason = reason;
            ban.expired_at = expired_at;
            Ok(format!("{}:{}", user_id, server_id))
        } else {
            Err("Ban not found".to_string())
        }
    }
}
