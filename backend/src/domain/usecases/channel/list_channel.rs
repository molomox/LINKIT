use crate::domain::entities::channel::Channel;
use crate::domain::ports::channel_repository::ChannelRepository;

pub struct ListServerChannel<'a> {
    pub repo: &'a dyn ChannelRepository,
}

impl<'a> ListServerChannel<'a> {
    pub fn execute(&self, server_id: String) -> Result<Vec<Channel>, String> {
        if server_id.is_empty() {
            return Err("Entrez un id serveur valide".to_string());
        }
        let channels = self.repo.find_by_server(server_id);
        match channels {
            Ok(channels) => Ok(channels),
            Err(e) => Err(e),
        }
    }
}
