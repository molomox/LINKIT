use crate::domain::entities::message::Message;
use crate::domain::ports::channel_repository::ChannelRepository;
use crate::domain::ports::member_repository::MemberRepository;
use crate::domain::ports::message_repository::MessageRepository;

pub struct DeleteMessage<'a> {
    pub message_repo: &'a dyn MessageRepository,
    pub channel_repo: &'a dyn ChannelRepository,
    pub member_repo: &'a dyn MemberRepository,
}

impl<'a> DeleteMessage<'a> {
    pub fn execute(&self, message_id: String, deleter_user_id: String) -> Result<String, String> {
        // 1. Vérifier que l'ID n'est pas vide
        if message_id.is_empty() {
            return Err("L'ID du message est requis".to_string());
        }

        // 2. Récupérer le message
        let message = self.message_repo.find_by_id(message_id.clone())?;
        let author_user_id = message.user.user_id.clone();
        let channel_id = message.channel_id.clone();

        // 3. Récupérer le channel pour avoir le server_id
        let channel = self.channel_repo.find_by_id(channel_id.clone())?;
        let server_id = channel.server_id.clone();

        // 4. Si c'est son propre message, OK directement
        if deleter_user_id == author_user_id {
            self.message_repo.delete(message_id)?;
            return Ok(channel_id);
        }

        // 5. Sinon, vérifier les rôles (Owner ou Admin)
        let deleter_member = self
            .member_repo
            .get_by_user_and_server(deleter_user_id.clone(), server_id.clone())
            .map_err(|_| "Vous n'êtes pas membre de ce serveur".to_string())?;

        let author_member = self
            .member_repo
            .get_by_user_and_server(author_user_id.clone(), server_id.clone())
            .map_err(|_| "Auteur introuvable".to_string())?;

        // 6. Vérifier les permissions selon le rôle
        let can_delete = match deleter_member.role.role_id.as_str() {
            "role04" => true, // Owner peut tout supprimer
            "role03" => {
                // Admin peut supprimer Membre/Ban seulement
                author_member.role.role_id == "role02" || author_member.role.role_id == "role01"
            }
            _ => false, // Membre ne peut supprimer que les siens (déjà géré)
        };

        if !can_delete {
            return Err("Permission refusée: vous ne pouvez pas supprimer ce message".to_string());
        }

        // 7. Supprimer le message
        self.message_repo.delete(message_id)?;

        Ok(channel_id)
    }
}
