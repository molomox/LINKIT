use std::any::Any;

use crate::domain::entities::server::Server;
use crate::domain::ports::server_repository::ServerRepository;

pub struct UpdateServer<'a> {
    pub repo: &'a dyn ServerRepository,
}

impl<'a> UpdateServer<'a> {
    pub fn execute(
        &self,
        server_id: String,
        new_name: String,
        new_password: String,
    ) -> Result<Server, String> {
        if server_id.is_empty() || new_name.is_empty() {
            return Err("Need the server id and the new name".to_string());
        }
        let mut server = self
            .repo
            .find_by_id(server_id.clone())
            .map_err(|e| format!("List server failed: {}", e))?;
        if new_name != "" {
            server.name = new_name;
        }
        if new_password != "" {
            server.password = new_password;
        }
        self.repo
            .update(server.clone())
            .map_err(|e| format!("Save server failed: {}", e))?;
        return Ok(server);
    }
}
