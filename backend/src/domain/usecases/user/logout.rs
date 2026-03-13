use crate::domain::ports::user_repository::UserRepository;

pub struct LogoutUser<'a> {
    pub repo: &'a dyn UserRepository,
}

impl<'a> LogoutUser<'a> {
    pub fn execute(&self, user_id: String) -> Result<(), String> {
        if user_id.is_empty() {
            return Err("L'ID utilisateur est requis".to_string());
        }

        // Invalider le token en le mettant à None
        self.repo.update_token(user_id, None)?;

        Ok(())
    }
}
