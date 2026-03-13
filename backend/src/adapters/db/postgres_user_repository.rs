use postgres::Client;
use postgres::NoTls;
use crate::domain::entities::message::Message;
use crate::adapters::http::constants::db_url;
use crate::domain::entities::user::User;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::user_repository::UserRepository;

pub struct PostgresUserRepo;
impl UserRepository for PostgresUserRepo{
    fn save(&self, user: User) -> Result<User, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO users (user_id,username, password,email,create_at,token) VALUES ($1, $2, $3, $4,$5,$6)",
            &[&user.user_id, &user.username, &user.password,&user.email, &user.create_at, &user.token]
        ).map_err(|e| e.to_string())?;
        Ok(user)
    }

    fn find_by_id(&self, id : String) -> Result<User, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let row = client
            .query_one(
                "SELECT user_id,username, password,email,create_at,token FROM users WHERE user_id = $1;",
                &[&id]
            ).map_err(|e| e.to_string())?;

        let user_id: String = row.get(0);
        let username: String = row.get(1);
        let password: String = row.get(2);
        let email: String = row.get(3);
        let create_at: String = row.get(4);
        let token: Option<String> = row.get(5);
        let user = User {
            user_id,
            username,
            password,
            email,
            create_at,
            token
        };
        Ok(user)
    }

    fn find_by_username(&self, username: String) -> Result<User, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let row = client
            .query_one(
                "SELECT user_id,username, password,email,create_at,token FROM users WHERE username = $1",
                &[&username]
            ).map_err(|e| e.to_string())?;

        let user_id: String = row.get(0);
        let username: String = row.get(1);
        let password: String = row.get(2);
        let email: String = row.get(3);
        let create_at: String = row.get(4);
        let token: Option<String> = row.get(5);
        let user = User {
            user_id,
            username,
            password,
            email,
            create_at,
            token
        };
        Ok(user)
    }

    
    fn update_token(&self, user_id: String, token: Option<String>) -> Result<(), String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "UPDATE users SET token = $2 WHERE user_id = $1",
            &[&user_id, &token]
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    }
}