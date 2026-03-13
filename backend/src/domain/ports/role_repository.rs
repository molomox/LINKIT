use crate::domain::entities::role::Role;

pub trait RoleRepository {
    fn find_by_id(&self, id: String) -> Result<Role, String>;
    fn find_by_name(&self, name: String) -> Result<Role, String>;
}
