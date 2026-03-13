use crate::domain::entities::user::User;

pub trait UserRepository {
    fn save(&self, user: User) -> Result<User, String>;
    fn find_by_id(&self, id: String) -> Result<User, String>;
    fn find_by_username(&self, username: String) -> Result<User, String>;
    fn update_token(&self, user_id: String, token: Option<String>) -> Result<(), String>;
}
