use crate::domain::ports::member_repository::MemberRepository;

pub struct LeaveServer<'a> {
    pub repo: &'a dyn MemberRepository,
}

impl<'a> LeaveServer<'a> {
    pub fn execute(&self, user_id: String, server_id: String) -> Result<(), String> {
        if user_id.is_empty() || server_id.is_empty() {
            return Err("Besoin d'un userId et serverId".to_string());
        }
        self.repo.delete_member(user_id, server_id);
        Ok(())
    }
}
