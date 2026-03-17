use crate::domain::entities::server::Server;

pub trait ServerRepository {
    fn save(&self, server: Server) -> Result<Server, String>;
    fn update(&self, server: Server) -> Result<Server, String>;
    fn find_by_id(&self, server_id: String) -> Result<Server, String>;
    fn find_by_user_id(&self, user_id: String) -> Result<Vec<Server>, String>;
    fn find_by_invite_code(&self, invite_code: String) -> Result<Server, String>;
    fn delete_server(&self, server_id: String) -> Result<String, String>;
}
