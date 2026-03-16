use crate::domain::entities::member::Member;

pub trait MemberRepository {
    fn save(&self, member: Member) -> Result<Member, String>;
    fn find_by_id(&self, id: String) -> Result<Member, String>;
    fn get_by_user_and_server(&self, user_id: String, server_id: String) -> Result<Member, String>;
    fn update_member_role(
        &self,
        user_id: String,
        server_id: String,
        role_id: String,
    ) -> Result<String, String>;
    fn delete_member(&self, user_id: String, server_id: String) -> Result<String, String>;
    fn find_by_server_id(&self, server_id: String) -> Result<Vec<Member>, String>;
}
