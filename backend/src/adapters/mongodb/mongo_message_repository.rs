use crate::adapters::http::constants::db_url;
use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;
use mongodb::{ 
	bson::{Document, doc},
	Client,
	Collection 
};

pub struct MongoMessageRepo;
impl MessageRepository for MongoMessageRepo {
    fn save(&self, message: Message) -> Result<Message, String> {

        let mut client = Client::with_uri_str(&mongo_url()).await.map_err(|e| format!("Failed to connect to MongoDB: {}", e))?;
        let database = client.database("mongo_db");
        let collection: Collection<Document> = database.collection("messages");
        collection.insert_one(doc! {"message_id": message.message_id, "content": message.content, "channel_id": message.channel_id, "user": message.user, "create_at": message.create_at, "IS_GIF": message.is_gif}, None).await.map_err(|e| format!("Failed to save message: {}", e))?;

        Ok(message)
    }

    fn delete(&self, message_id: String) -> Result<String, String> {
        let mut client = Client::with_uri_str(&mongo_url()).await.map_err(|e| format!("Failed to connect to MongoDB: {}", e))?;
        let database = client.database("mongo_db");
        let collection: Collection<Document> = database.collection("messages");
        collection.delete_one(doc! {"message_id": message_id}, None).await.map_err(|e| format!("Failed to delete message: {}", e))?;
        Ok(message_id)
    }

    fn update(&self, message: Message) -> Result<Message, String> {
        let mut client = Client::with_uri_str(&mongo_url()).await?;
        let database = client.database("mongo_db");
        let collection: Collection<Document> = database.collection("messages");

        collection.update_one(
            doc! {"message_id": message.message_id},
            doc! {"$set": {"content": message.content}},
            None
        ).await.map_err(|e| format!("Failed to update message: {}", e))?;
        Ok(message)
    }

    fn find_by_id(&self, message_id: String) -> Result<Message, String> {
        let mut client = Client::with_uri_str(&mongo_url()).await.map_err(|e| format!("Failed to connect to MongoDB: {}", e))?;
        let database = client.database("mongo_db");
        let collection: Collection<Document> = database.collection("messages");
        let row = collection.find_one(doc! {"message_id": message_id}, None).await.map_err(|e| format!("Failed to find message: {}", e))?;

        let message = Message {
            message_id: row.get("message_id").unwrap_or_default(),
            content: row.get("content").unwrap_or_default(),
            channel_id: row.get("channel_id").unwrap_or_default(),
            user: crate::domain::entities::user::User {
                user_id: row.get("user_id").unwrap_or_default(),
                username: row.get("username").unwrap_or_default(),
                email: row.get("email").unwrap_or_default(),
                password: String::new(),
                create_at: String::new(),
                token: None,
            },
            create_at: row.get("create_at").unwrap_or_default(),
            is_gif: row.get("IS_GIF").unwrap_or_default(),
            reactions: row.get("reactions").unwrap_or_default(),
        };

        Ok(message)
    }

    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String> {
        let mut client = Client::with_uri_str(&mongo_url()).await.map_err(|e| format!("Failed to connect to MongoDB: {}", e))?;
        let database = client.database("mongo_db");
        let collection: Collection<Document> = database.collection("messages");
        let mut messages = Vec::new();
        let cursor = collection.find(doc! {"channel_id": channel_id}, None).await.map_err(|e| format!("Failed to find messages: {}", e))?;
        while let Some(result) = cursor.next().await {
            match result {
                Ok(row) => {
                    let message = Message {
                        message_id: row.get("message_id").unwrap_or_default(),
                        content: row.get("content").unwrap_or_default(),
                        channel_id: row.get("channel_id").unwrap_or_default(),
                        user: crate::domain::entities::user::User {
                            user_id: row.get("user_id").unwrap_or_default(),
                            username: row.get("username").unwrap_or_default(),
                            email: row.get("email").unwrap_or_default(),
                            password: String::new(),
                            create_at: String::new(),
                            token: None,
                        },
                        create_at: row.get("create_at").unwrap_or_default(),
                        is_gif: row.get("IS_GIF").unwrap_or_default(),
                        reactions: row.get("reactions").unwrap_or_default(),
                    };
                    messages.push(message);
                }
                Err(e) => return Err(format!("Failed to read message from cursor: {}", e)),
            }
        }

        Ok(messages)
    }
}
