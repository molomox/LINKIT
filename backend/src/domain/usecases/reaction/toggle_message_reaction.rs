use crate::domain::ports::reaction_repository::ReactionRepository;
use crate::domain::ports::reagi_repository::ReagiRepository;
use crate::domain::entities::reaction::Reaction;
use crate::domain::entities::reagi::Reagi;
use crate::domain::entities::user::User;
use crate::domain::entities::message::Message;

pub struct ToggleMessageReaction<'a>{
    pub reaction_repo: &'a dyn ReactionRepository,
    pub reagi_repo: &'a dyn ReagiRepository,
}

impl<'a> ToggleMessageReaction<'a>{
    pub fn execute(
        &self,
        user: User,
        message: Message,
        reaction: Reaction
    )-> Result<String, String>{
        if user.user_id.is_empty() || message.message_id.is_empty() || reaction.reaction_id <= 0 {
            return Err("Veuillez entrer les paramètres nécessaires".to_string());
        }
        let reaction_exists = self.reaction_repo.exists(reaction.reaction_id)
            .map_err(|e| format!("Erreur lors de la vérification de l'existence de la réaction: {}", e))?;
        
        if !reaction_exists {
            return Err("La réaction spécifiée n'existe pas".to_string());
        }

        let reagi_exists = self.reagi_repo.exists(user.user_id.clone(), message.message_id.clone(), reaction.reaction_id)
            .map_err(|e| format!("Erreur lors de la vérification de l'existence du reagi: {}", e))?;

        if reagi_exists {
            self.reagi_repo.delete_reaction(user.user_id.clone(), message.message_id.clone(), reaction.reaction_id)
                .map_err(|e| format!("Erreur lors de la suppression du reagi: {}", e))?;
            Ok("removed".to_string())
        } else {
            let new_reagi = Reagi {
                user: user.clone(),
                message: message.clone(),
                reaction: reaction,
            };
            self.reagi_repo.save(new_reagi)
                .map_err(|e| format!("Erreur lors de l'ajout du reagi: {}", e))?;
            Ok("added".to_string())
        }
    }
}