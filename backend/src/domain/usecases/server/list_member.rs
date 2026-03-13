use crate::domain::entities::member::Member;
use crate::domain::ports::member_repository::MemberRepository;

pub struct ListServerMembers<'a> {
    pub repo: &'a dyn MemberRepository,
}

impl<'a> ListServerMembers<'a> {
    pub fn execute(&self, server_id: String) -> Result<Vec<Member>, String> {
        if server_id.is_empty() {
            return Err("Besoin d'un serverId".to_string());
        }
        let members = self.repo.find_by_server_id(server_id);
        Ok(members?)
    }
}
