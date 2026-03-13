use postgres::{Client, NoTls};

use crate::adapters::http::constants::db_url;
use crate::domain::entities::message::Message;
use crate::domain::entities::reagi::Reagi;
use crate::domain::entities::reaction::Reaction;
use crate::domain::entities::user::User;
use crate::domain::ports::reagi_repository::ReagiRepository;

pub struct PostgresReagiRepo;

impl ReagiRepository for PostgresReagiRepo {
    fn save(&self, reagi: Reagi) -> Result<Reagi, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client
            .execute(
                "INSERT INTO reagi (reaction_id, user_id, message_id) VALUES ($1, $2, $3)",
                &[
                    &reagi.reaction.reaction_id,
                    &reagi.user.user_id,
                    &reagi.message.message_id,
                ],
            )
            .map_err(|e| format!("Failed to save reagi: {}", e))?;

        Ok(reagi)
    }

    fn find_by_message_id(&self, message_id: String) -> Result<Vec<Reagi>, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let rows = client
            .query(
                "SELECT m.message_id, m.channel_id, m.content, m.create_at, m.is_gif,
                        u.user_id, u.username, u.email,
                        r.reaction_id, r.emoji, r.nom_reaction
                 FROM reagi rg
                 JOIN messages m ON m.message_id = rg.message_id
                 JOIN users u ON u.user_id = rg.user_id
                 JOIN reaction r ON r.reaction_id = rg.reaction_id
                 WHERE rg.message_id = $1",
                &[&message_id],
            )
            .map_err(|e| format!("Failed to find reagi by message_id: {}", e))?;

        let mut reagis = Vec::new();

        for row in rows {
            let user = User {
                user_id: row.get(5),
                username: row.get(6),
                email: row.get(7),
                password: String::new(),
                create_at: String::new(),
                token: None,
            };

            let message = Message {
                message_id: row.get(0),
                channel_id: row.get(1),
                content: row.get(2),
                create_at: row.get(3),
                is_gif: row.get(4),
                user: user.clone(),
                reactions: Vec::new(),
            };

            let reaction = Reaction {
                reaction_id: row.get(8),
                emoji: row.get(9),
                reaction_name: row.get(10),
            };

            reagis.push(Reagi {
                message,
                user,
                reaction,
            });
        }

        Ok(reagis)
    }

    fn delete_reaction(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let affected = client
            .execute(
                "DELETE FROM reagi WHERE user_id = $1 AND message_id = $2 AND reaction_id = $3",
                &[&user_id, &message_id, &reaction_id],
            )
            .map_err(|e| format!("Failed to delete reagi: {}", e))?;

        if affected == 0 {
            return Err("No reaction found to delete".to_string());
        }

        Ok("deleted".to_string())
    }

    fn exists(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<bool, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client
            .query_one(
                "SELECT EXISTS(
                    SELECT 1 FROM reagi
                    WHERE user_id = $1 AND message_id = $2 AND reaction_id = $3
                )",
                &[&user_id, &message_id, &reaction_id],
            )
            .map_err(|e| format!("Failed to check reagi existence: {}", e))?;

        Ok(row.get::<usize, bool>(0))
    }
}
