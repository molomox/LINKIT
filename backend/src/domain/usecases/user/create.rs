use crate::domain::entities::user::User;
use crate::domain::ports::user_repository::UserRepository;
use chrono::Utc;
use uuid::Uuid;

pub struct CreateUser<'a> {
    pub repo: &'a dyn UserRepository,
}

impl<'a> CreateUser<'a> {
    pub fn execute(
        &self,
        username: String,
        password: String,
        email: String,
    ) -> Result<User, String> {
        if username.is_empty() || password.is_empty() || email.is_empty() {
            return Err("Remplir tous les champs".to_string());
        }
        let user_id = Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();
        let user = User {
            user_id,
            username,
            password,
            email,
            create_at,
            token: None,
        };

        // Sauvegarder en base de données et retourner le résultat
        self.repo.save(user)
    }
}
