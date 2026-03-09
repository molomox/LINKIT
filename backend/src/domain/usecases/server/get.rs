use crate::domain::ports::server_repository::ServerRepository;
use crate::domain::entities::server::Server;

pub struct GetServerDetails<'a>{
    pub repo: &'a dyn ServerRepository,
}

impl<'a> GetServerDetails<'a>{
    pub fn execute(
        &self,
        server_id: String,
    ) -> Result<Server, String>{
        if server_id.is_empty(){
            return Err("Mettre un id valide".to_string());
        }

        // Propager l'erreur réelle au lieu de la masquer
        self.repo.find_by_id(server_id)
            .map_err(|e| format!("Erreur lors de la récupération du serveur: {}", e))
    }
}