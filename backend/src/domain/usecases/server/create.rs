use crate::domain::entities::server::Server;
use crate::domain::ports::server_repository::ServerRepository;
use uuid::Uuid;
use chrono::Utc;

pub struct CreateServer<'a>{
    pub repo: &'a dyn ServerRepository,
}

impl<'a> CreateServer<'a> {
    pub fn execute (
        &self,
        name: String,
        password: String,
     ) -> Result<Server, String> {
        if name.is_empty() || password.is_empty(){
            return Err("Entrez un nom et un password".to_string());
        }
        let server_id = Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();
        let invite_code = Uuid::new_v4().to_string();
        let server = Server{
            server_id,
            create_at,
            name,
            password,
            invite_code,
            all_channels: Vec::new(),
        };
        self.repo.save(server.clone()).map_err(|e| e.to_string())?;
        Ok(server)
        }

    }

#[cfg(test)]
mod test{
    use crate::domain::{entities::server::Server, ports::server_repository::ServerRepository, usecases::server::create::CreateServer};

    struct FakeRepo;

    impl ServerRepository for FakeRepo{
        fn save(&self, _: Server)-> Result<Server, String> {
            Ok(Server{
                server_id: "server_id".to_string(),
                create_at: "2024-01-01".to_string(),
                name: "server".to_string(),
                password: "password".to_string(),
                invite_code: "invite_code".to_string(),
                all_channels: vec![],
            })
        }
        fn find_by_id(&self, _: String) -> Result<Server, String> {
            Err("Server not found".to_string())
        }
        fn find_by_user_id(&self, _user_id: String) -> Result<Vec<Server>, String> {
            Ok(vec![])
        }
        fn find_by_invite_code(&self, _invite_code: String) -> Result<Server, String> {
            Err("Server not found".to_string())
        }
        fn delete_server(&self, server_id: String) -> Result<String, String> {
            let _ = server_id;
            Ok("deleted_server_id".to_string())
        }
        fn update(&self, server: Server) -> Result<Server, String> {
            Ok(server)
        }
    }

    #[test]
    fn server_name_return_name(){
        let repo = FakeRepo;
        let usecase = CreateServer{repo: &repo};
        
        let server = usecase.execute(
            "server".into(),
            "123".into(),
        );
        assert!(server.is_ok());
        let srv = server.unwrap();
        assert_eq!(srv.name,"server");

    }
}
