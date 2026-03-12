use std::any::Any;

use axum::Json;
use axum::response::Response;

use crate::domain::entities::user::User;
use crate::domain::ports::server_repository::ServerRepository;
use crate::domain::entities::server::Server;
use crate::domain::ports::user_repository::UserRepository;


pub struct GetUserByUsername<'a>{
    pub repo: &'a dyn UserRepository,
}

impl<'a> GetUserByUsername<'a>{
    pub fn execute(
        &self,
        username: String,
    ) -> Result<User, String>{
        if username.is_empty(){
            return Err("Mettre un username valide".to_string());
        }
        let user = self.repo.find_by_username(username);
        if user.is_err() {
            return  Err("username introuvable".to_string());
        } 
        return user;
    }
    
}