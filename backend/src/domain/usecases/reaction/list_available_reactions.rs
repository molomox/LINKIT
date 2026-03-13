use crate::domain::ports::reaction_repository::ReactionRepository;
use crate::domain::entities::reaction::Reaction;

pub struct ListAvailableReactions<'a>{
    pub repo : &'a dyn ReactionRepository,
}

impl<'a> ListAvailableReactions<'a>{
    pub fn execute(&self) -> Result<Vec<Reaction>, String>{
        let reactions = self.repo.find_all()
            .map_err(|e| format!("Erreur lors de la récupération des réactions: {}", e))?;
        
        Ok(reactions)
    }
}