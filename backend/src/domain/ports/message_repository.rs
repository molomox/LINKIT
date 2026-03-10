use crate::domain::entities::message::Message;

pub trait MessageRepository{
    fn save(&self, message: Message) -> Result<Message, String>;
    fn update(&self, message: Message) -> Result<Message, String>;
    fn delete(&self, message_id: String) -> Result<String, String>;
    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String>;
    fn find_by_id(&self, message_id: String) -> Result<Message, String>;
}