use crate::domain::entities::{server::Server, member::Member, role::Role, user::User};
use crate::domain::ports::{
    server_repository::ServerRepository,
    member_repository::MemberRepository,
    role_repository::RoleRepository,
};
use crate::domain::usecases::server::{
    create::CreateServer,
    delete::DeleteServer,
    get::GetServerDetails,
    find_by_user_id::GetServerByUser,
    join::JoinServer,
    join_by_invite::JoinServerByInvite,
    leave::LeaveServer,
    list::ListUserServers,
    list_member::ListServerMembers,
    update::UpdateServer,
    update_member::UpdateMemberRole,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};


struct MockServerRepository {
    servers: Arc<Mutex<HashMap<String, Server>>>,
}

impl MockServerRepository {
    fn new() -> Self {
        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn create_test_server(&self, server_id: &str, name: &str, password: &str) -> Server {
        return Server {
            server_id: server_id.to_string(),
            name: name.to_string(),
            invite_code: format!("invite-{}", server_id),
            password: password.to_string(),
            all_channels: Vec::new(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
        };
    }

    fn add_server(&self, server: Server) {
        self.servers.lock().unwrap().insert(server.server_id.clone(), server);
    }
}

impl ServerRepository for MockServerRepository {
    fn save(&self, server: Server) -> Result<Server, String> {
        self.servers.lock().unwrap().insert(server.server_id.clone(), server.clone());
        Ok(server)
    }

    fn find_by_id(&self, server_id: String) -> Result<Server, String> {
        self.servers
            .lock()
            .unwrap()
            .get(&server_id)
            .cloned()
            .ok_or_else(|| "Server not found".to_string())
    }

    fn find_by_user_id(&self, user_id: String) -> Result<Vec<Server>, String> {
        Ok(self.servers.lock().unwrap().values().cloned().collect())
    }

    fn find_by_invite_code(&self, invite_code: String) -> Result<Server, String> {
        self.servers
            .lock()
            .unwrap()
            .values()
            .find(|s| s.invite_code == invite_code)
            .cloned()
            .ok_or_else(|| "Server not found".to_string())
    }

    fn delete_server(&self, server_id: String) -> Result<String, String> {
        self.servers
            .lock()
            .unwrap()
            .remove(&server_id)
            .map(|_| server_id)
            .ok_or_else(|| "Server not found".to_string())
    }

    fn update(&self, server: Server) -> Result<Server, String> {
        let mut servers = self.servers.lock().unwrap();
        if servers.contains_key(&server.server_id) {
            servers.insert(server.server_id.clone(), server.clone());
            Ok(server)
        } else {
            Err("Server not found".to_string())
        }
    }
}

struct MockMemberRepository {
    members: Arc<Mutex<Vec<Member>>>,
}

impl MockMemberRepository {
    fn new() -> Self {
        Self {
            members: Arc::new(Mutex::new(Vec::new())),
        }
    }

    fn create_test_member(&self, user_id: &str, server_id: &str) -> Member {
        return Member {
            user: User {
                user_id: user_id.to_string(),
                username: format!("User{}", user_id),
                email: format!("user{}@example.com", user_id),
                create_at: "2024-01-01T00:00:00Z".to_string(),
                password: "password".to_string(),
                token: None,
            },
            server: Server {
                server_id: server_id.to_string(),
                name: format!("Server{}", server_id),
                invite_code: format!("invite-{}", server_id),
                password: "".to_string(),
                all_channels: Vec::new(),
                create_at: "2024-01-01T00:00:00Z".to_string(),
            },
            role: Role {
                role_id: "role-default".to_string(),
                role_name: "Member".to_string(),
            },
            join_at: "2024-01-01T00:00:00Z".to_string(),
        };
    }
}

impl MemberRepository for MockMemberRepository {
    fn save(&self, member: Member) -> Result<Member, String> {
        self.members.lock().unwrap().push(member.clone());
        Ok(member)
    }
    fn find_by_id(&self, id: String) -> Result<Member, String> {
        self.members
            .lock()
            .unwrap()
            .iter()
            .find(|m| m.user.user_id == id)
            .cloned()
            .ok_or_else(|| "Member not found".to_string())
    }

    fn get_by_user_and_server(&self, user_id: String, server_id: String) -> Result<Member, String> {
        self.members
            .lock()
            .unwrap()
            .iter()
            .find(|m| m.user.user_id == user_id && m.server.server_id == server_id)
            .cloned()
            .ok_or_else(|| "Member not found".to_string())
    }

    fn find_by_server_id(&self, server_id: String) -> Result<Vec<Member>, String> {
        let members: Vec<Member> = self
            .members
            .lock()
            .unwrap()
            .iter()
            .filter(|m| m.server.server_id == server_id)
            .cloned()
            .collect();
        Ok(members)
    }

    fn delete_member(&self, user_id: String, server_id: String) -> Result<String, String> {
        let mut members = self.members.lock().unwrap();
        members.retain(|m| !(m.user.user_id == user_id && m.server.server_id == server_id));
        Ok(format!("Deleted member {} from server {}", user_id, server_id))
    }

    fn update_member_role(
        &self,
        user_id: String,
        server_id: String,
        _role_id: String,
    ) -> Result<String, String> {
        Ok(format!("Role updated for user {} in server {}", user_id, server_id))
    }
}

struct MockRoleRepository {
    roles: Arc<Mutex<HashMap<String, Role>>>,
}

impl MockRoleRepository {
    fn new() -> Self {
        let repo = Self {
            roles: Arc::new(Mutex::new(HashMap::new())),
        };
        // Ajouter un rôle par défaut
        repo.add_role(Role {
            role_id: "role-default".to_string(),
            role_name: "Member".to_string(),
        });
        repo
    }

    fn create_test_role(&self, role_id: &str, role_name: &str) -> Role {
        return Role {
            role_id: role_id.to_string(),
            role_name: role_name.to_string(),
        };
    }

    fn add_role(&self, role: Role) {
        self.roles.lock().unwrap().insert(role.role_id.clone(), role);
    }
}

impl RoleRepository for MockRoleRepository {
    fn find_by_id(&self, role_id: String) -> Result<Role, String> {
        self.roles
            .lock()
            .unwrap()
            .get(&role_id)
            .cloned()
            .ok_or_else(|| "Role not found".to_string())
    }
    fn find_by_name(&self, name: String) -> Result<Role,String> {
        self.roles
            .lock()
            .unwrap()
            .values()
            .find(|r| r.role_name == name)
            .cloned()
            .ok_or_else(|| "Role not found".to_string())
    }
}

#[test]
fn test_create_server() {
    let repo = MockServerRepository::new();
    let use_case = CreateServer { repo: &repo };

    let result = use_case.execute("MyServer".to_string(), "password123".to_string());

    assert!(result.is_ok());
    let server = result.unwrap();
    assert_eq!(server.name, "MyServer");
    assert_eq!(server.password, "password123");
    assert!(!server.server_id.is_empty());
    assert!(!server.invite_code.is_empty());
}

#[test]
fn test_create_server_empty_name() {
    let repo = MockServerRepository::new();
    let use_case = CreateServer { repo: &repo };

    let result = use_case.execute("".to_string(), "password123".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Entrez un nom et un password");
}

#[test]
fn test_create_server_empty_password() {
    let repo = MockServerRepository::new();
    let use_case = CreateServer { repo: &repo };

    let result = use_case.execute("MyServer".to_string(), "".to_string());

    assert!(result.is_err());
}

#[test]
fn test_get_server() {
    let repo = MockServerRepository::new();
    let server = repo.create_test_server("srv-1", "MyServer", "pass123");
    repo.add_server(server);

    let use_case = GetServerDetails { repo: &repo };
    let result = use_case.execute("srv-1".to_string());

    assert!(result.is_ok());
    let found = result.unwrap();
    assert_eq!(found.name, "MyServer");
}

#[test]
fn test_get_server_empty() {
    let repo = MockServerRepository::new();
    let use_case = GetServerDetails { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Mettre un id valide");
}

#[test]
fn test_get_server_none() {
    let repo = MockServerRepository::new();
    let use_case = GetServerDetails { repo: &repo };

    let result = use_case.execute("non-existent".to_string());

    assert!(result.is_err());
}

#[test]
fn test_delete_server() {
    let repo = MockServerRepository::new();
    let server = repo.create_test_server("srv-1", "MyServer", "pass123");
    repo.add_server(server);

    let use_case = DeleteServer { repo: &repo };
    let result = use_case.execute("srv-1".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "srv-1");
}

#[test]
fn test_delete_server_empty() {
    let repo = MockServerRepository::new();
    let use_case = DeleteServer { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Besoin d'un id de server");
}

#[test]
fn test_update_server_name() {
    let repo = MockServerRepository::new();
    let server = repo.create_test_server("srv-1", "OldName", "pass123");
    repo.add_server(server);

    let use_case = UpdateServer { repo: &repo };
    let result = use_case.execute("srv-1".to_string(), "NewName".to_string(), "".to_string());

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.name, "NewName");
    assert_eq!(updated.password, "pass123"); // Password unchanged
}

#[test]
fn test_update_server_password() {
    let repo = MockServerRepository::new();
    let server = repo.create_test_server("srv-1", "MyServer", "oldpass");
    repo.add_server(server);

    let use_case = UpdateServer { repo: &repo };
    let result = use_case.execute("srv-1".to_string(), "MyServer".to_string(), "newpass".to_string());

    assert!(result.is_ok());
    let updated = result.unwrap();
    assert_eq!(updated.password, "newpass");
}

#[test]
fn test_update_server_empty() {
    let repo = MockServerRepository::new();
    let use_case = UpdateServer { repo: &repo };

    let result = use_case.execute("".to_string(), "NewName".to_string(), "".to_string());

    assert!(result.is_err());
}

#[test]
fn test_get_user_servers() {
    let repo = MockServerRepository::new();
    repo.add_server(repo.create_test_server("srv-1", "Server1", "pass1"));
    repo.add_server(repo.create_test_server("srv-2", "Server2", "pass2"));

    let use_case = ListUserServers { repo: &repo };
    let result = use_case.execute("user-1");

    assert!(result.is_ok());
    let servers = result.unwrap();
    assert_eq!(servers.len(), 2);
}

#[test]
fn test_get_user_servers_empty() {
    let repo = MockServerRepository::new();
    let use_case = ListUserServers { repo: &repo };

    let result = use_case.execute("");

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Need a user_id");
}

#[test]
fn test_get_server_by_user() {
    let repo = MockServerRepository::new();
    repo.add_server(repo.create_test_server("srv-1", "Server1", "pass1"));

    let use_case = GetServerByUser { repo: &repo };
    let result = use_case.execute("user-1".to_string());

    assert!(result.is_ok());
}

#[test]
fn test_get_server_by_user_empty() {
    let repo = MockServerRepository::new();
    let use_case = GetServerByUser { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Mettre un id valide");
}

#[test]
fn test_join_server() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let server = server_repo.create_test_server("srv-1", "MyServer", "password123");
    server_repo.add_server(server);

    let use_case = JoinServer {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "user-1".to_string(),
        "srv-1".to_string(),
        "password123".to_string(),
        "role-default".to_string(),
    );

    assert!(result.is_ok());
    let member = result.unwrap();
    assert_eq!(member.user.user_id, "user-1");
    assert_eq!(member.server.server_id, "srv-1");
}

#[test]
fn test_join_server_wrong_password() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let server = server_repo.create_test_server("srv-1", "MyServer", "password123");
    server_repo.add_server(server);

    let use_case = JoinServer {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "user-1".to_string(),
        "srv-1".to_string(),
        "wrongpass".to_string(),
        "role-default".to_string(),
    );

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Mauvais mot de passe");
}

#[test]
fn test_join_server_empty() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let use_case = JoinServer {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "".to_string(),
        "".to_string(),
        "".to_string(),
        "".to_string(),
    );

    assert!(result.is_err());
}

#[test]
fn test_join_server_none() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let use_case = JoinServer {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "user-1".to_string(),
        "non-existent".to_string(),
        "pass".to_string(),
        "role-default".to_string(),
    );

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Serveur introuvable");
}

#[test]
fn test_join_by_invite() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let server = server_repo.create_test_server("srv-1", "MyServer", "password123");
    server_repo.add_server(server);

    let use_case = JoinServerByInvite {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "user-1".to_string(),
        "invite-srv-1".to_string(),
        "role-default".to_string(),
    );

    assert!(result.is_ok());
    let member = result.unwrap();
    assert_eq!(member.user.user_id, "user-1");
}

#[test]
fn test_join_by_invite_invalid_code() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let use_case = JoinServerByInvite {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute(
        "user-1".to_string(),
        "invalid-code".to_string(),
        "role-default".to_string(),
    );

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Code d'invitation invalide");
}

#[test]
fn test_join_by_invite_empty() {
    let server_repo = MockServerRepository::new();
    let member_repo = MockMemberRepository::new();
    let role_repo = MockRoleRepository::new();

    let use_case = JoinServerByInvite {
        repo: &server_repo,
        repo2: &member_repo,
        repo3: &role_repo,
    };

    let result = use_case.execute("".to_string(), "".to_string(), "".to_string());

    assert!(result.is_err());
}

#[test]
fn test_leave_server() {
    let repo = MockMemberRepository::new();
    let use_case = LeaveServer { repo: &repo };

    let result = use_case.execute("user-1".to_string(), "srv-1".to_string());

    assert!(result.is_ok());
}

#[test]
fn test_leave_server_empty() {
    let repo = MockMemberRepository::new();
    let use_case = LeaveServer { repo: &repo };

    let result = use_case.execute("".to_string(), "".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Besoin d'un userId et serverId");
}

#[test]
fn test_get_server_members() {
    let repo = MockMemberRepository::new();
    let use_case = ListServerMembers { repo: &repo };

    let result = use_case.execute("srv-1".to_string());

    assert!(result.is_ok());
}

#[test]
fn test_get_server_members_empty() {
    let repo = MockMemberRepository::new();
    let use_case = ListServerMembers { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Besoin d'un serverId");
}

#[test]
fn test_update_member_role() {
    let repo = MockMemberRepository::new();
    let use_case = UpdateMemberRole { repo: &repo };

    let result = use_case.execute(
        "user-1".to_string(),
        "srv-1".to_string(),
        "role-admin".to_string(),
    );

    assert!(result.is_ok());
}

#[test]
fn test_update_member_role_empty() {
    let repo = MockMemberRepository::new();
    let use_case = UpdateMemberRole { repo: &repo };

    let result = use_case.execute("".to_string(), "".to_string(), "".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Veuillez renseignez tous les champs");
}