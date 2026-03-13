use crate::domain::entities::member::Member;
use crate::domain::ports::member_repository::MemberRepository;

pub struct UpdateMemberRole<'a> {
    pub repo: &'a dyn MemberRepository,
}

impl<'a> UpdateMemberRole<'a> {
    pub fn execute(
        &self,
        user_id: String,
        server_id: String,
        role_id: String,
    ) -> Result<String, String> {
        if user_id.is_empty() || server_id.is_empty() || role_id.is_empty() {
            return Err("Veuillez renseignez tous les champs".to_string());
        }
        let update = self
            .repo
            .update_member_role(user_id, server_id, role_id)
            .map_err(|e| format!("Update member role failed: {}", e))?;
        Ok(update)
    }
}
