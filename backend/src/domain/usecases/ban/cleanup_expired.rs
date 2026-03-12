use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use chrono::{DateTime, Utc};

pub struct CleanupExpiredBans<'a> {
    pub ban_repo: &'a dyn BanRepository,
    pub member_repo: &'a dyn MemberRepository,
}

impl<'a> CleanupExpiredBans<'a> {
    pub fn execute(&self, server_id: String) -> Result<Vec<String>, String> {
        if server_id.is_empty() {
            return Err("Server ID requis".to_string());
        }

        // Récupérer tous les bans du serveur
        let all_bans = self.ban_repo
            .find_by_server(server_id.clone())
            .map_err(|e| format!("Échec de récupération des bans: {}", e))?;

        let now = Utc::now();
        let mut unbanned_users = Vec::new();

        for ban in all_bans {
            // Parser la date d'expiration
            match DateTime::parse_from_rfc3339(&ban.expired_at) {
                Ok(expired_at) => {
                    let expired_at_utc = expired_at.with_timezone(&Utc);
                    
                    // Si le ban a expiré
                    if expired_at_utc <= now {
                        println!("🔓 Ban expiré détecté: user {} sur serveur {}", ban.bannished_user_id, server_id);
                        
                        // Supprimer le ban
                        if let Err(e) = self.ban_repo.deban(ban.bannished_user_id.clone(), server_id.clone()) {
                            eprintln!("❌ Échec suppression ban expiré: {}", e);
                            continue;
                        }
                        
                        // Restaurer le rôle à Membre (role02)
                        if let Err(e) = self.member_repo.update_member_role(
                            ban.bannished_user_id.clone(),
                            server_id.clone(),
                            "role02".to_string()
                        ) {
                            eprintln!("❌ Échec restauration rôle: {}", e);
                            continue;
                        }
                        
                        unbanned_users.push(ban.bannished_user_id.clone());
                        println!("✅ Utilisateur {} débanni automatiquement", ban.bannished_user_id);
                    }
                }
                Err(e) => {
                    eprintln!("⚠️ Date d'expiration invalide pour ban: {}", e);
                }
            }
        }

        Ok(unbanned_users)
    }
}
