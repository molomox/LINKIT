use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use uuid::Uuid;
use chrono::Utc;


pub struct UserServer<'a>{
    pub repo: &'a dyn BanRepository,
}

impl<'a> UserServer<'a>{
    pub fn execute(
        &self,
        bannished_user_id: String,
        server_id: String
    )-> Result<Ban, String>{
        if bannished_user_id.is_empty() || server_id.is_empty(){
            return Err("Veuillez entrer les parametres necessaires".to_string());
        }
        return self.repo.find_by_user_and_server(bannished_user_id, server_id).is_err() {return  Err("id introuvable".to_string());} ;
    }
}

