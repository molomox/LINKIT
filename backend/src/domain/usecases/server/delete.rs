use crate::domain::ports::server_repository::ServerRepository;

pub struct DeleteServer<'a> {
    pub repo: &'a dyn ServerRepository,
}

impl<'a> DeleteServer<'a> {
    pub fn execute(&self, server_id: String) -> Result<(String), String> {
        if server_id.is_empty() {
            return Err("Besoin d'un id de server".to_string());
        }
        let deleted_id = self.repo.delete_server(server_id)?;
        Ok(deleted_id)
    }
}
