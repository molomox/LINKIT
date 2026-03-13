use crate::adapters::http::constants::db_url;
use crate::domain::entities::role::{self, Role};
use crate::domain::ports::role_repository::RoleRepository;
use postgres::Client;
use postgres::NoTls;

pub struct PostgresRoleRepo;
impl RoleRepository for PostgresRoleRepo {
    fn find_by_id(&self, id: String) -> Result<Role, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client
            .query_one(
                "SELECT role_id,
                role_name
                FROM roles
                WHERE role_id = $1",
                &[&id],
            )
            .map_err(|e| e.to_string())?;
        let role = Role {
            role_id: row.get(0),
            role_name: row.get(1),
        };
        Ok(role)
    }

    fn find_by_name(&self, name: String) -> Result<Role, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        let row = client
            .query_one(
                "SELECT role_id,
                role_name,
                FROM roles
                WHERE members.role_name = $1",
                &[&name],
            )
            .map_err(|e| e.to_string())?;
        let role = Role {
            role_id: row.get(0),
            role_name: row.get(1),
        };
        Ok(role)
    }
}
