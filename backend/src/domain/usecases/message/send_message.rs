use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::user_repository::UserRepository;
use uuid::Uuid;
use chrono::Utc;
use crate::domain::entities::user::User;

pub struct SendMessage<'a> {
    pub repo_message: &'a dyn MessageRepository,
    pub repo_user: &'a dyn UserRepository,
}

impl<'a> SendMessage<'a> {
    pub fn execute(
        &self,
        channel_id: String,
        user_id: String,
        content: String,
    ) -> Result<Message, String> {
        // Validations
        if content.is_empty() {
            return Err("Le contenu du message ne peut pas être vide".to_string());
        }
        if user_id.is_empty() {
            return Err("L'ID utilisateur est requis".to_string());
        }
        if channel_id.is_empty() {
            return Err("L'ID du channel est requis".to_string());
        }

        // Récupérer le username depuis la base de données
        let user = self.repo_user.find_by_id(user_id.clone())
        .map_err(|e| format!("Erreur lors de la récupération de l'utilisateur: {}", e))?;

        // Génération de l'ID et du timestamp
        let message_id = Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();

        // Création du message avec le username récupéré
        let message = Message {
            message_id,
            channel_id,
            user: User {
                user_id,
                username: user.username,
                email: "".to_string(),
                password: "".to_string(),
                create_at: "".to_string(),
                token: None,
            },
            content,
            create_at,
            is_gif: false,
            reactions: Vec::new(),
        };

        // Sauvegarder en base de données et retourner le résultat
        self.repo_message.save(message)
    }
}

