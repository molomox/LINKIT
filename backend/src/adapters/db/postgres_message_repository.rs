use crate::adapters::http::constants::db_url;
use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;
use postgres::Client;
use postgres::NoTls;

pub struct PostgresMessageRepo;
impl MessageRepository for PostgresMessageRepo {
    fn save(&self, message: Message) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO messages (message_id, content, channel_id, user_id, create_at, IS_GIF) VALUES ($1, $2, $3, $4, $5, $6)",
            &[&message.message_id, &message.content, &message.channel_id, &message.user.user_id, &message.create_at, &message.is_gif]
        ).map_err(|e| format!("Failed to save message: {}", e))?;

        Ok(message)
    }

    fn delete(&self, message_id: String) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        client
            .execute("DELETE FROM messages WHERE message_id = $1", &[&message_id])
            .map_err(|e| format!("Failed to delete message: {}", e))?;
        Ok(message_id)
    }

    fn update(&self, message: Message) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client
            .execute(
                "UPDATE messages SET content = $2 WHERE message_id = $1",
                &[&message.message_id, &message.content],
            )
            .map_err(|e| e.to_string())?;
        Ok(message)
    }
    fn find_by_id(&self, message_id: String) -> Result<Message, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client.query_one(
            "SELECT m.message_id, m.content, m.channel_id, m.user_id, m.create_at, u.username, u.email, m.IS_GIF
             FROM messages m
             JOIN users u ON u.user_id = m.user_id
             WHERE m.message_id = $1",
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
            is_gif: row.get(7),
            reactions: Vec::new(),
        };

        Ok(message)
    }

    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let mut messages: Vec<Message> = Vec::new();

        for row in client.query(
            "SELECT m.message_id, m.content, m.channel_id, m.user_id, m.create_at, u.username, u.email,
                    r.reaction_id, r.emoji, m.IS_GIF
             FROM messages m
             JOIN users u ON u.user_id = m.user_id
             LEFT JOIN reagi rg ON rg.message_id = m.message_id
             LEFT JOIN reaction r ON r.reaction_id = rg.reaction_id
             WHERE m.channel_id = $1
             ORDER BY m.create_at ASC
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
                    is_gif: row.get(9),
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
}
