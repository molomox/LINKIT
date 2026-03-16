use crate::domain::entities::user::User;
use crate::domain::jwt::generate_token;
use crate::domain::ports::user_repository::UserRepository;

pub struct LoginUser<'a> {
    pub repo: &'a dyn UserRepository,
}

impl<'a> LoginUser<'a> {
    pub fn execute(&self, username: String, password: String) -> Result<User, String> {
        if username.is_empty() || password.is_empty() {
            return Err("Entrer un Utilisateur ou Mots de passe".to_string());
        }
        let mut user = match self.repo.find_by_username(username.clone()) {
            Ok(user) => user,
            Err(_e) => return Err("User not found".to_string()),
        };
        if user.password != password {
            return Err("Wrong password".to_string());
        }

        // Générer un token JWT
        let token = generate_token(&user.user_id, &user.username)?;

        // Mettre à jour le token dans la base de données
        self.repo
            .update_token(user.user_id.clone(), Some(token.clone()))?;

        // Ajouter le token à l'objet user retourné
        user.token = Some(token);

        Ok(user)
    }
}
