use std::any::Any;

use axum::Json;
use axum::response::Response;

use crate::domain::entities::user::User;
use crate::domain::ports::server_repository::ServerRepository;
use crate::domain::entities::server::Server;
use crate::domain::ports::user_repository::UserRepository;


pub struct GetUserById<'a>{
    pub repo: &'a dyn UserRepository,
}

impl<'a> GetUserById<'a>{
    pub fn execute(
        &self,
        user_id: String,
    ) -> Result<User, String>{
        if user_id.is_empty(){
            return Err("Mettre un id valide".to_string());
        }
        let user = self.repo.find_by_id(user_id);
        if user.is_err() {
            return  Err("id introuvable".to_string());
        } 
        return user;
    }
    
}