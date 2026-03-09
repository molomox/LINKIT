use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::role_repository::RoleRepository;
use crate::domain::ports::server_repository::ServerRepository;
use crate::domain::entities::role::{self, Role};
use crate::domain::entities::member::Member;
use chrono::Utc;
use crate::domain::entities::user::User;

pub struct JoinServer<'a>{
    pub repo: &'a dyn ServerRepository,
    pub repo2: &'a dyn MemberRepository,
    pub repo3: &'a dyn RoleRepository,
}

impl<'a> JoinServer<'a> {
    pub fn execute(
        &self,
        user_id: String,
        server_id: String,
        password: String,
        role_id: String,
    ) -> Result<Member, String> {
        if user_id.is_empty() || server_id.is_empty() || role_id.is_empty() || password.is_empty(){
            return Err("Veuillez entre un User, Server, Role et un password".to_string());
        }
        let server = match self.repo.find_by_id(server_id.clone()){
            Ok(s) => s,
            Err(_) => return Err("Serveur introuvable".to_string()),
        };
        let role = match self.repo3.find_by_id(role_id.clone()){
            Ok(r) => r,
            Err(_) => return Err("Rôle introuvable".to_string()),
        };
        if server.password != password{
            return Err("Mauvais mot de passe".to_string());
        }
        let join_at = Utc::now().to_string();
        let member = Member{
            user: User{
                user_id: user_id.clone(),
                username: "".to_string(),
                email: "".to_string(),
                password: "".to_string(),
                create_at: "".to_string(),
                token: None,
            },
            server,
            join_at,
            role: Role{
                role_id: role.role_id,
                role_name: role.role_name,
            },
        };
        
        // Sauvegarder en base de données et retourner le résultat
        self.repo2.save(member)
    }
}
