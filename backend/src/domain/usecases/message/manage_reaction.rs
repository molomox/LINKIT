use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::channel_repository::ChannelRepository;
use crate::domain::ports::user_repository::UserRepository;
use  crate::domain::entities::reagi::Reagi;

pub struct ManageReaction<'a>{
    pub message_repo: &'a dyn MessageRepository,
    pub user_repo: &'a dyn UserRepository,
}

impl<'a> ManageReaction<'a>{
    pub fn execute(
        &self,
        message_id: String,
        user_id: String,
        reaction_id: String,
    ) -> Result<String, String>{

        let message = self.message_repo.find_by_id(message_id.clone())
            .map_err(|e| format!("Erreur lors de la récupération du message: {}", e))?;

        let user = self.user_repo.find_by_id(user_id.clone())
            .map_err(|e| format!("Erreur lors de la récupération du membre: {}", e))?;

        let reaction = self.message_repo.find_reaction_emoji(reaction_id.clone())
            .map_err(|e| format!("Erreur lors de la récupération de la réaction: {}", e))?;

        let reagi = Reagi {
            message,
            user,
            reaction,
        };

        // Vérifier si le membre a déjà réagi
        let has_reacted = self.message_repo.find_reaction(reagi.clone())
            .map_err(|e| format!("Erreur lors de la vérification de la réaction: {}", e))?;
        
        if has_reacted {
            // Supprimer la réaction
            self.message_repo.delete_reaction(reagi.clone())
                .map_err(|e| format!("Erreur lors de la suppression de la réaction: {}", e))?;
        }
        else {
            // Ajouter la réaction
            self.message_repo.create_reaction(reagi.clone())
                .map_err(|e| format!("Erreur lors de l'ajout de la réaction: {}", e))?;
        }
        Ok(channel_id)
    }
}