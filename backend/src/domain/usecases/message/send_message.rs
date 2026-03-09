use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;
use uuid::Uuid;
use chrono::Utc;
use crate::domain::entities::user::User;
use postgres::Client;
use postgres::NoTls;
use crate::adapters::http::constants::DB_URL;

pub struct SendMessage<'a> {
    pub repo: &'a dyn MessageRepository,
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
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;
        let username = client
            .query_one("SELECT username FROM users WHERE user_id = $1", &[&user_id])
            .map(|row| row.get::<_, String>(0))
            .unwrap_or_else(|_| "Utilisateur inconnu".to_string());

        // Génération de l'ID et du timestamp
        let message_id = Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();

        // Création du message avec le username récupéré
        let message = Message {
            message_id,
            channel_id,
            user: User {
                user_id,
                username, // ← Username récupéré de la DB !
                email: "".to_string(),
                password: "".to_string(),
                create_at: "".to_string(),
                token: None,
            },
            content,
            create_at,
        };

        // Sauvegarder en base de données et retourner le résultat
        self.repo.save(message)
    }
}

