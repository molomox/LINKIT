use std::any::Any;

use axum::response::Response;
use axum::Json;

use crate::domain::entities::server::Server;
use crate::domain::ports::server_repository::ServerRepository;

pub struct GetServerByUser<'a> {
    pub repo: &'a dyn ServerRepository,
}

impl<'a> GetServerByUser<'a> {
    pub fn execute(&self, user_id: String) -> Result<Vec<Server>, String> {
        if user_id.is_empty() {
            return Err("Mettre un id valide".to_string());
        }
        let server = self.repo.find_by_user_id(user_id);
        if server.is_err() {
            return Err("id introuvable".to_string());
        }
        return server;
    }
}
