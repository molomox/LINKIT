use crate::domain::entities::message::Message;
use crate::domain::ports::channel_repository::ChannelRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::message_repository::MessageRepository;

pub struct UpdateMessage<'a> {
    pub message_repo: &'a dyn MessageRepository,
    pub channel_repo: &'a dyn ChannelRepository,
    pub member_repo: &'a dyn MemberRepository,
}

impl<'a> UpdateMessage<'a> {
    pub fn execute(
        &self,
        message_id: String,
        editor_user_id: String,
        content: String,
    ) -> Result<(String, String, String), String> {
        // (channel_id, message_id, username)

        // 1. Vérifier que l'ID n'est pas vide
        if message_id.is_empty() {
            return Err("L'ID du message est requis".to_string());
        }

        // 2. Récupérer le message
        let mut message = self.message_repo.find_by_id(message_id.clone())?;
        let author_user_id = message.user.user_id.clone();
        let username = message.user.username.clone();
        let channel_id = message.channel_id.clone();

        // 3. Récupérer le channel pour avoir le server_id
        let channel = self.channel_repo.find_by_id(channel_id.clone())?;
        let server_id = channel.server_id.clone();

        // 4. Si c'est son propre message, OK directement
        if editor_user_id == author_user_id {
            message.content = content;
            let updated_message = self.message_repo.update(message)?;
            return Ok((channel_id, updated_message.message_id, username));
        }

        // 5. Sinon, seul le propriétaire peut modifier son message
        Err("Vous ne pouvez modifier que vos propres messages".to_string())
    }
}
