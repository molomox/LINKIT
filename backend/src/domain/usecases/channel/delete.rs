use crate::domain::ports::channel_repository::ChannelRepository;

pub struct DeleteChannel<'a>{
    pub repo: &'a dyn ChannelRepository,
}

impl<'a> DeleteChannel<'a>{
    pub fn execute(
        &self, 
        channel_id: String,
    )-> Result<String, String>{
        if channel_id.is_empty(){
            return Err("Besoin d'un id valide".to_string());
        }
        let delete_channel_id = self.repo.delete_channel(channel_id)?;
        Ok(delete_channel_id)
    }
}