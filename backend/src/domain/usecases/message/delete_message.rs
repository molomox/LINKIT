use crate::domain::entities::message::Message;
use crate::domain::ports::message_repository::MessageRepository;

pub struct DeleteMessage<'a>{
    pub repo: &'a dyn MessageRepository,
}
impl<'a> DeleteMessage<'a>{
    pub fn execute(
        &self,
        message_id: String
    ) -> Result<String, String>{

        if message_id.is_empty(){
            return Err("L'ID du message est requis".to_string());
        }
        let delete_message = self.repo.delete(message_id)?;
        Ok(delete_message)
    }
}