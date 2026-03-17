use crate::test_unitaire::mock_ban_repository::MockBanRepository;
use crate::domain::entities::{member::Member, role::Role, server::Server, user::User};
use crate::domain::ports::{
    member_repository::MemberRepository, role_repository::RoleRepository,
    server_repository::ServerRepository,
};
use crate::domain::usecases::server::create::CreateServer;
use crate::domain::usecases::server::delete::DeleteServer;
use crate::domain::usecases::server::find_by_user_id::GetServerByUser;
use crate::domain::usecases::server::get::GetServerDetails;
use crate::domain::usecases::server::join::JoinServer;
use crate::domain::usecases::server::join_by_invite::JoinServerByInvite;
use crate::domain::usecases::server::leave::LeaveServer;
use crate::domain::usecases::server::list::ListUserServers;
use crate::domain::usecases::server::list_member::ListServerMembers;
use crate::domain::usecases::server::update::UpdateServer;
use crate::domain::usecases::server::update_member::UpdateMemberRole;
use crate::test_unitaire::mock_repositories::{
    MockMemberRepository, MockRoleRepository, MockServerRepository,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[cfg(test)]
mod tests {
    use super::*;
    // Removed unused/conflicting imports
    use crate::test_unitaire::mock_ban_repository::MockBanRepository;
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

            let ban_repo = MockBanRepository::new();
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
        let result = use_case.execute(
            "srv-1".to_string(),
            "MyServer".to_string(),
            "newpass".to_string(),
        );

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
        repo.add_member(Member {
            user: User {
                user_id: "user-1".to_string(),
                username: "User1".to_string(),
                password: "pass".to_string(),
                email: "user1@example.com".to_string(),
                create_at: "2024-01-01T00:00:00Z".to_string(),
                token: None,
            },
            server: Server {
                server_id: "srv-1".to_string(),
                name: "Server1".to_string(),
                invite_code: "invite-srv-1".to_string(),
                password: "pass1".to_string(),
                all_channels: Vec::new(),
                create_at: "2024-01-01T00:00:00Z".to_string(),
            },
            role: Role {
                role_id: "role01".to_string(),
                role_name: "Membre".to_string(),
            },
            join_at: "2024-01-01T00:00:00Z".to_string(),
        });

        let use_case = ListUserServers { repo: &repo };
        let result = use_case.execute("user-1");

        assert!(result.is_ok());
        let servers = result.unwrap();
        assert_eq!(servers.len(), 1);
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

        let ban_repo = MockBanRepository::new();
        let use_case = JoinServer {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
        };

        let result = use_case.execute(
            "user-1".to_string(),
            "srv-1".to_string(),
            "password123".to_string(),
            "role02".to_string(),
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
        let ban_repo = MockBanRepository::new();

        let server = server_repo.create_test_server("srv-1", "MyServer", "password123");
        server_repo.add_server(server);

        let ban_repo = MockBanRepository::new();
        let use_case = JoinServer {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
        };

        let result = use_case.execute(
            "user-1".to_string(),
            "srv-1".to_string(),
            "wrongpass".to_string(),
            "role02".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Mauvais mot de passe");
    }

    #[test]
    fn test_join_server_empty() {
        let server_repo = MockServerRepository::new();
        let member_repo = MockMemberRepository::new();
        let role_repo = MockRoleRepository::new();
        let ban_repo = MockBanRepository::new();

        let use_case = JoinServer {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
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
        let ban_repo = MockBanRepository::new();

        let use_case = JoinServer {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
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
        let ban_repo = MockBanRepository::new();

        let server = server_repo.create_test_server("srv-1", "MyServer", "password123");
        server_repo.add_server(server);
        let use_case = JoinServerByInvite {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
        };

        let result = use_case.execute(
            "user-1".to_string(),
            "invite-srv-1".to_string(),
            "role02".to_string(),
        );

        assert!(result.is_ok());
        let member = result.unwrap();
        assert_eq!(member.user.user_id, "user-1");
        assert_eq!(member.role.role_name, "Membre");
        assert_eq!(member.server.server_id, "srv-1");
    }

    #[test]
    fn test_join_by_invite_invalid_code() {
        let server_repo = MockServerRepository::new();
        let member_repo = MockMemberRepository::new();
        let role_repo = MockRoleRepository::new();

        let ban_repo = MockBanRepository::new();
        let use_case = JoinServerByInvite {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
        };

        let result = use_case.execute(
            "user-test".to_string(),
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
        let ban_repo = MockBanRepository::new();

        let use_case = JoinServerByInvite {
            repo: &server_repo,
            repo2: &member_repo,
            repo3: &role_repo,
            ban_repo: &ban_repo,
        };

        let result = use_case.execute("".to_string(), "".to_string(), "".to_string());

        assert!(result.is_err());
    }

    #[test]
    fn test_leave_server() {
        let repo = MockMemberRepository::new();
        let use_case = LeaveServer { repo: &repo };

        let result = use_case.execute("user-test".to_string(), "srv-1".to_string());

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
            "user-test".to_string(),
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
}
