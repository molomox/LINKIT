use crate::domain::entities::channel::Channel;
use crate::domain::ports::channel_repository::ChannelRepository;

pub struct GetChannelDetails<'a> {
    pub repo: &'a dyn ChannelRepository,
}

impl<'a> GetChannelDetails<'a> {
    pub fn execute(&self, channel_id: String) -> Result<Channel, String> {
        if channel_id.is_empty() {
            return Err("Evoyer un id valide".to_string());
        }
        let channel = match self.repo.find_by_id(channel_id) {
            Ok(channel) => channel,
            Err(e) => return Err("Channel not found".to_string()),
        };

        Ok(channel)
    }
}
