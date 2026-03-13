use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;

pub struct ListMessage<'a> {
    pub repo: &'a dyn MessageRepository,
}

impl<'a> ListMessage<'a> {
    pub fn execute(&self, channel_id: String) -> Result<Vec<Message>, String> {
        if channel_id.is_empty() {
            return Err("L'ID du channel est requis".to_string());
        }

        let messages = self
            .repo
            .find_by_channel(channel_id)
            .map_err(|e| format!("Erreur lors de la récupération des messages: {}", e))?;

        Ok(messages)
    }
}
