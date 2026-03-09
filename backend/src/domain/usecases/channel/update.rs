use crate::domain::entities::channel::Channel;
use crate::domain::ports::channel_repository::ChannelRepository;


pub struct UpdateChannel<'a>{
    pub repo: &'a dyn ChannelRepository,
}

impl<'a> UpdateChannel<'a>{
    pub fn execute(
        self,
        channel_id: String,
        new_name: String,
    )-> Result<Channel, String>{
        if channel_id.is_empty() || new_name.is_empty(){
            return Err("Besoin d'un id valide".to_string());
        }
        let mut channel = match self.repo.find_by_id(channel_id){
            Ok(channel) => channel,
            Err(_e) => return Err("Channel not found".to_string()),
        };
        channel.name = new_name;
        self.repo.update(channel.clone());
        Ok(channel)
    }
}