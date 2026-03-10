use postgres::{Client, NoTls};
use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
use crate::adapters::http::constants::DB_URL;


pub struct PostgresBanRepo;
impl BanRepository for PostgresBanRepo{
    fn save(&self, ban: Ban)-> Result<Ban,String>{
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO bans (
            ban_id,server_id,bannished_user_id,banned_by_user_id,reason,expired_at,create_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            &[ &ban.ban_id,&ban.server_id, &ban.bannished_user_id, &ban.banned_by_user_id, &ban.reason, &ban.expired_at, &ban.create_at]
        ).map_err(|e| e.to_string())?;
        Ok(ban)
    }
    fn find_by_user_and_server(&self, user_id: String, server_id: String) -> Result<Ban, String>{
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;
        let row = client
            .query_one(
                "SELECT ban_id,server_id,bannished_user_id,banned_by_user_id,reason,expired_at,create_at FROM bans WHERE bannished_user_id = $1 AND server_id = $2",
                &[&user_id, &server_id]
            ).map_err(|e| e.to_string())?;

        let ban_id: String = row.get(0);
        let server_id: String = row.get(1);
        let bannished_user_id: String = row.get(2);
        let banned_by_user_id: String = row.get(3);
        let reason: String = row.get(4);
        let expired_at: String = row.get(5);
        let create_at: String = row.get(6);
        let ban = Ban {
            ban_id,
            server_id,
            bannished_user_id,
            banned_by_user_id,
            reason,
            expired_at,
            create_at
        };
        Ok(ban)
    }
    fn update_ban(&self, user_id: String, server_id: String, reason: String, expired_at: String,) -> Result<String,String>{
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string()).unwrap();
        client.execute("UPDATE bans SET reason = $3, expired_at = $4 WHERE bannished_user_id = $1 AND server_id = $2", &[&user_id, &server_id, &reason, &expired_at]).unwrap();
        Ok(user_id)
    }
    fn deban(&self, user_id: String, server_id: String) -> Result<String, String> {
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string()).unwrap();
        client.execute("DELETE FROM bans WHERE bannished_user_id = $1 AND server_id = $2", &[&user_id, &server_id]).unwrap();
        Ok(())
    }
}