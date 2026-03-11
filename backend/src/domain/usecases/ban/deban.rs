use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use uuid::Uuid;
use chrono::Utc;


pub struct Deban<'a>{
    pub repo: &'a dyn BanRepository,
}

impl<'a> Deban<'a>{
    pub fn execute(
        &self,
        bannished_user_id: String,
        server_id: String
    )-> Result<String, String>{
        if bannished_user_id.is_empty() || server_id.is_empty() {
            return Err("Veuillez entrer les parametres necessaires".to_string());
        }
        self.repo.deban(bannished_user_id, server_id)
            .map_err(|e| format!("Deban failed: {}", e))?;
        return Ok("Utilisateur debanni avec succes".to_string());
    }
}

