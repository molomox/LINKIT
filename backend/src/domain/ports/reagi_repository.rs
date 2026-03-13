use crate::domain::entities::reagi::Reagi;


pub trait ReagiRepository{
    fn save(&self, reagi: Reagi)-> Result<Reagi, String>;
    fn find_by_message_id(&self, message_id: String) -> Result<Vec<Reagi>, String>;
    fn delete_reaction(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<String, String>;
    fn exists(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<bool, String>;
}