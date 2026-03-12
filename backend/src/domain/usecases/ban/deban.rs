use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use uuid::Uuid;
use chrono::Utc;


pub struct Deban<'a>{
    pub repo: &'a dyn BanRepository,
    pub member_repo: &'a dyn MemberRepository,
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
        // Supprimer le ban de la base de données
        self.repo.deban(bannished_user_id.clone(), server_id.clone())
            .map_err(|e| format!("Deban failed: {}", e))?;
        
        // Restaurer le rôle du membre à role02 (Membre)
        self.member_repo.update_member_role(
            bannished_user_id,
            server_id,
            "role02".to_string()
        )
        .map_err(|e| format!("Failed to restore member role: {}", e))?;
        
        return Ok("Utilisateur debanni avec succes".to_string());
    }
}

