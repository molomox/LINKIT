use postgres::Client;
use postgres::NoTls;
use crate::domain::entities::message::Message;
use crate::adapters::http::constants::db_url;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::entities::reagi::Reagi;
use crate::domain::entities::reaction::Reaction;

pub struct PostgresMessageRepo;
impl MessageRepository for PostgresMessageRepo{
    
    fn save(&self, message: Message) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO messages (message_id, content, channel_id, user_id, create_at) VALUES ($1, $2, $3, $4, $5)",
            &[&message.message_id, &message.content, &message.channel_id, &message.user.user_id, &message.create_at]
        ).map_err(|e| format!("Failed to save message: {}", e))?;

        Ok(message)
    }
    
    fn delete(&self, message_id: String) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        client.execute(
            "DELETE FROM messages WHERE message_id = $1", 
            &[&message_id]
        ).map_err(|e| format!("Failed to delete message: {}", e))?;
        Ok(message_id)
    }
    
    fn update(&self, message: Message) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "UPDATE messages SET content = $2 WHERE message_id = $1",
            &[&message.message_id, &message.content]
        ).map_err(|e| e.to_string())?;
        Ok(message)
    }
    fn find_by_id(&self, message_id: String) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client.query_one(
            "SELECT message_id, content, channel_id, user_id, create_at, username, email
            FROM view_messages
            WHERE message_id = $1",
            &[&message_id]
        ).map_err(|e| e.to_string())?;

        let message = Message {
            message_id: row.get(0),
            content: row.get(1),
            channel_id: row.get(2),
            user: crate::domain::entities::user::User {
                user_id: row.get(3),
                username: row.get(5),
                email: row.get(6),
                password: String::new(),
                create_at: String::new(),
                token: None,
            },
            create_at: row.get(4),
            is_gif: false,
            reactions: Vec::new(),
        };

        Ok(message)
    }
    
    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let mut messages: Vec<Message> = Vec::new();

        for row in client.query(
            "SELECT message_id, content, channel_id, user_id, create_at, username, email, reaction_id, emoji, reaction_user_id, IS_GIF, reaction_username
            FROM view_messages
            WHERE channel_id = $1
            ORDER BY create_at ASC
            LIMIT 100",
            &[&channel_id]
        ).map_err(|e| e.to_string())? {
            let msg_id: String = row.get(0);
            let reaction_id: Option<i32> = row.get(7);

            if let Some(existing) = messages.iter_mut().find(|m| m.message_id == msg_id) {
                if let Some(r_id) = reaction_id {
                    existing.reactions.push(crate::domain::entities::reaction::Reaction {
                        reaction_id: r_id,
                        emoji: row.get(8),
                        reaction_name: String::new(),
                    });
                }
            } else {
                let mut msg = Message {
                    message_id: msg_id,
                    content: row.get(1),
                    channel_id: row.get(2),
                    user: crate::domain::entities::user::User {
                        user_id: row.get(3),
                        username: row.get(5),
                        email: row.get(6),
                        password: String::new(),
                        create_at: String::new(),
                        token: None,
                    },
                    create_at: row.get(4),
                    is_gif: row.get(10),
                    reactions: Vec::new(),
                };
                if let Some(r_id) = reaction_id {
                    msg.reactions.push(crate::domain::entities::reaction::Reaction {
                        reaction_id: r_id,
                        emoji: row.get(8),
                        reaction_name: String::new(),
                    });
                }
                messages.push(msg);
            }
        }

        Ok(messages)
    }
    fn find_reaction(&self, reagi: Reagi) -> Result<bool, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client.query_one(
            "SELECT count(*)
            FROM view_messages
            WHERE message_id = $1 AND reaction_user_id = $2 AND reaction_id = $3",
            &[&reagi.message.message_id, &reagi.user.user_id, &reagi.reaction.reaction_id]
        ).map_err(|e| e.to_string())?;

        if row.get::<usize, i64>(0) > 0 {
            return Ok(true);
        } else {
            return Ok(false);
        }
    }

    fn create_reaction(&self, reagi: Reagi) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO reactions (message_id, user_id, reaction_id) VALUES ($1, $2, $3)",
            &[&reagi.message.message_id, &reagi.user.user_id, &reagi.reaction.reaction_id]
        ).map_err(|e| format!("Failed to create reaction: {}", e))?;

        return Ok("Reaction added".to_string());
    }

    fn delete_reaction(&self,reagi: Reagi) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "DELETE FROM reactions WHERE message_id = $1 AND user_id = $2 AND reaction_id = $3", 
            &[&reagi.message.message_id, &reagi.user.user_id, &reagi.reaction.reaction_id]
        ).map_err(|e| format!("Failed to delete reaction: {}", e))?;

        return Ok("Reaction removed".to_string());
    }

    fn find_reaction_emoji(&self, reaction_id: String) -> Result<Reaction,String>{
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client.query_one(
            "SELECT reaction_id, emoji, nom_reaction 
            FROM reaction
            WHERE reaction_id = $1",
            &[&reaction_id]
        ).map_err(|e| e.to_string())?;

        let reaction = Reaction {
            reaction_id: row.get(0),
            emoji: row.get(1),
            nom_reaction: row.get(2)
        };

        Ok(reaction)
    }
}