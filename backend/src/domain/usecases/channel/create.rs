use crate::domain::entities::channel::Channel;
use crate::domain::ports::channel_repository::ChannelRepository;
use chrono::Utc;
use uuid::Uuid;

pub struct CreateChannel<'a> {
    pub repo: &'a dyn ChannelRepository,
}

impl<'a> CreateChannel<'a> {
    pub fn execute(&self, name: String, server_id: String) -> Result<Channel, String> {
        if name.is_empty() || server_id.is_empty() {
            return Err("Veuillez entrer le nom du channel".to_string());
        }
        let channel_id = Uuid::new_v4().to_string();
        let create_at = Utc::now().to_string();
        let channel = Channel {
            channel_id,
            create_at,
            name,
            server_id,
        };

        // Sauvegarder en base de données et retourner le résultat
        self.repo.save(channel)
    }
}
