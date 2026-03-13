use crate::domain::entities::reaction::Reaction;

pub trait ReactionRepository{
    fn save(&self, reaction: Reaction)-> Result<Reaction, String>;
    fn exists(&self, reaction_id: i32) -> Result<bool, String>;
    fn find_by_id(&self, reaction_id: i32) -> Result<Reaction, String>;
    fn find_all(&self) -> Result<Vec<Reaction>, String>;
}