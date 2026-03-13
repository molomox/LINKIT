use postgres::{Client, NoTls};

use crate::adapters::http::constants::db_url;
use crate::domain::entities::reaction::Reaction;
use crate::domain::ports::reaction_repository::ReactionRepository;

pub struct PostgresReactionRepo;

impl ReactionRepository for PostgresReactionRepo {
    fn save(&self, reaction: Reaction) -> Result<Reaction, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client
            .execute(
                "INSERT INTO reaction (reaction_id, emoji, nom_reaction) VALUES ($1, $2, $3)",
                &[&reaction.reaction_id, &reaction.emoji, &reaction.reaction_name],
            )
            .map_err(|e| format!("Failed to save reaction: {}", e))?;

        Ok(reaction)
    }

    fn exists(&self, reaction_id: i32) -> Result<bool, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client
            .query_one("SELECT EXISTS(SELECT 1 FROM reaction WHERE reaction_id = $1)", &[&reaction_id])
            .map_err(|e| format!("Failed to check reaction existence: {}", e))?;

        Ok(row.get::<usize, bool>(0))
    }

    fn find_by_id(&self, reaction_id: i32) -> Result<Reaction, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client
            .query_one(
                "SELECT reaction_id, emoji, nom_reaction FROM reaction WHERE reaction_id = $1",
                &[&reaction_id],
            )
            .map_err(|e| format!("Reaction not found: {}", e))?;

        Ok(Reaction {
            reaction_id: row.get(0),
            emoji: row.get(1),
            reaction_name: row.get(2),
        })
    }

    fn find_all(&self) -> Result<Vec<Reaction>, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let rows = client
            .query(
                "SELECT reaction_id, emoji, nom_reaction FROM reaction ORDER BY reaction_id ASC",
                &[],
            )
            .map_err(|e| format!("Failed to list reactions: {}", e))?;

        let reactions = rows
            .into_iter()
            .map(|row| Reaction {
                reaction_id: row.get(0),
                emoji: row.get(1),
                reaction_name: row.get(2),
            })
            .collect();

        Ok(reactions)
    }
}
