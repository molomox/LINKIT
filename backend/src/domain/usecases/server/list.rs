use crate::domain::entities::server::Server;
use crate::domain::ports::server_repository::ServerRepository;

pub struct ListUserServers<'a> {
    pub repo: &'a dyn ServerRepository,
}

impl<'a> ListUserServers<'a> {
    pub fn execute(&self, user_id: &str) -> Result<Vec<Server>, String> {
        if user_id.is_empty() {
            return Err("Need a user_id".to_string());
        }
        let servers = self
            .repo
            .find_by_user_id(user_id.to_string())
            .map_err(|e| format!("List server failed: {}", e))?;
        Ok(servers)
    }
}
