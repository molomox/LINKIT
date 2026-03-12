use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::user_repository::UserRepository;
use uuid::Uuid;
use chrono::Utc;


pub struct CreateBan<'a>{
    pub repo: &'a dyn BanRepository,
    pub member_repo: &'a dyn MemberRepository,
    pub user_repo: &'a dyn UserRepository,
}

impl<'a> CreateBan<'a>{
    pub fn execute(
        &self,
        bannished_user_id: String,
        server_id: String,
        reason: String,
        banned_by_user_id: String,
        expired_at: String,
    )-> Result<Ban, String>{
        if bannished_user_id.is_empty() || server_id.is_empty()|| reason.is_empty() || banned_by_user_id.is_empty() || expired_at.is_empty() {
            return Err("Veuillez entrer les parametres necessaires".to_string());
        }

        // Checks Permissions de ban

        //Recuperer la personne qui ban
        let banner_member = self.member_repo
            .get_by_user_and_server(banned_by_user_id.clone(), server_id.clone())
            .map_err(|e| format!("Utilisateur Non trouver:  {}", e))?;


        //Recuperer la personne bannie
        let target_member = self.member_repo
            .get_by_user_and_server(bannished_user_id.clone(), server_id.clone())
            .map_err(|e| format! ("Utilisateur Non trouver: {}",e ))?;

        // Verifier que le banner est soit Owner (role04) soit Admin (role03)
        if banner_member.role.role_id != "role04" && banner_member.role.role_id != "role03"{
            return Err("Permission Refusée: Seul Owner ou Admin peut ban".to_string());
        }

        // Verifier que l'on peut pas ban un Owner
        if target_member.role.role_id == "role04" {
            return Err("Impossible de ban le Owner".to_string());
        }

        // Verrifier qu'un Admin ne peut pas ban un autre Admin
        if target_member.role.role_id == "role03" && banner_member.role.role_id == "role03" {
            return Err("Vous ne pouvez pas bannir un autre Admin.".to_string());
        }

        // Recuperer le username de la personne bannie 
        let target_user = self.user_repo
            .find_by_id(bannished_user_id.clone())
            .map_err(|e| format!("Utilisateur Non trouver: {}", e))?;

        let ban_id= Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();
        let ban = Ban{
            ban_id,
            bannished_user_id,
            server_id,
            banned_by_user_id,
            reason,
            create_at,
            expired_at,
        };

        self.repo.save(ban.clone())?;

        // Changer le rôle du membre banni à "role01" (Ban)
        self.member_repo.update_member_role(
            ban.bannished_user_id.clone(), 
            ban.server_id.clone(), 
            "role01".to_string()
        )
        .map_err(|e| format!("Echec du changement de rôle: {}", e))?;
        
        Ok(ban)
    }
}

