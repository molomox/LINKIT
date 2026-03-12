use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use uuid::Uuid;
use chrono::Utc;


pub struct UpdateBan<'a>{
    pub repo: &'a dyn BanRepository,
}

impl<'a> UpdateBan<'a>{
    pub fn execute(
        &self,
        bannished_user_id: String,
        server_id: String,
        reason: String,
        expired_at: String,
    )-> Result<Ban, String>{
        if bannished_user_id.is_empty() || server_id.is_empty()|| reason.is_empty() || expired_at.is_empty() {
            return Err("Veuillez entrer les parametres necessaires".to_string());
        }
        let mut ban = self.repo.find_by_user_and_server(bannished_user_id.clone(), server_id.clone())
            .map_err(|e| format!("List ban failed: {}", e))?;
        if reason != ""{
            ban.reason = reason.clone();
        }
        if expired_at != ""   {
            ban.expired_at = expired_at.clone();
        }
        self.repo.update_ban(bannished_user_id.clone(), server_id.clone(), reason.clone(),expired_at.clone())
            .map_err(|e| format!("Save ban failed: {}", e))?;
        return Ok(ban);
    }
}

