use crate::domain::entities::member::Member;
use crate::domain::entities::role::Role;
use crate::domain::entities::user::User;
use crate::domain::ports::ban_repository::BanRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::role_repository::RoleRepository;
use crate::domain::ports::server_repository::ServerRepository;
use chrono::{DateTime, Utc};

pub struct JoinServerByInvite<'a> {
    pub repo: &'a dyn ServerRepository,
    pub repo2: &'a dyn MemberRepository,
    pub repo3: &'a dyn RoleRepository,
    pub ban_repo: &'a dyn BanRepository,
}

impl<'a> JoinServerByInvite<'a> {
    pub fn execute(
        &self,
        user_id: String,
        invite_code: String,
        role_id: String,
    ) -> Result<Member, String> {
        if user_id.is_empty() || invite_code.is_empty() || role_id.is_empty() {
            return Err("Veuillez entrer un User, Invite Code et Role".to_string());
        }

        let server = match self.repo.find_by_invite_code(invite_code.clone()) {
            Ok(s) => s,
            Err(_) => return Err("Code d'invitation invalide".to_string()),
        };

        let role = match self.repo3.find_by_id(role_id.clone()) {
            Ok(r) => r,
            Err(_) => return Err("Rôle introuvable".to_string()),
        };

        // Vérifier si l'utilisateur est banni
        match self
            .ban_repo
            .find_by_user_and_server(user_id.clone(), server.server_id.clone())
        {
            Ok(ban) => {
                // Vérifier si le ban est actif (pas expiré)
                if let Ok(expired_at) = DateTime::parse_from_rfc3339(&ban.expired_at) {
                    let now = Utc::now();
                    if expired_at.with_timezone(&Utc) > now {
                        // Ban toujours actif
                        return Err(format!(
                            "Vous êtes banni de ce serveur jusqu'au {}. Raison: {}",
                            expired_at.format("%d/%m/%Y %H:%M"),
                            ban.reason
                        ));
                    } else {
                        // Ban expiré, le supprimer automatiquement
                        println!("🔓 Ban expiré détecté lors du rejoin par invite, suppression automatique...");
                        if let Err(e) = self
                            .ban_repo
                            .deban(user_id.clone(), server.server_id.clone())
                        {
                            eprintln!("⚠️ Échec suppression ban expiré: {}", e);
                        }
                        // Continuer le processus de join
                    }
                }
            }
            Err(_) => {
                // Pas de ban trouvé, on peut continuer
            }
        }

        let join_at = Utc::now().to_string();
        let member = Member {
            user: User {
                user_id: user_id.clone(),
                username: "".to_string(),
                email: "".to_string(),
                password: "".to_string(),
                create_at: "".to_string(),
                token: None,
            },
            server,
            join_at,
            role: Role {
                role_id: role.role_id,
                role_name: role.role_name,
            },
        };

        // Sauvegarder en base de données et retourner le résultat
        self.repo2.save(member)
    }
}
