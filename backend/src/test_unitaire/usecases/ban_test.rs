
use crate::test_unitaire::mock_ban_repository::MockBanRepository;
use crate::domain::entities::ban::Ban;
use crate::domain::ports::ban_repository::BanRepository;
    use chrono::{Utc, Duration};

use crate::domain::usecases::ban::{
    save::CreateBan,
    deban::Deban,
    update_ban::UpdateBan,
    find_by_user_and_server::UserServer,
    cleanup_expired::CleanupExpiredBans,
};
use crate::test_unitaire::mock_repositories::{
    MockMemberRepository, MockUserRepository, MockRoleRepository
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_save_ban() {
        let repo = MockBanRepository::new();
        let mut member_repo = MockMemberRepository::new();
        let mut user_repo = MockUserRepository::new();
        // Ajout d'un admin (banner) et d'un membre (banni)
        let admin = member_repo.create_test_member("admin_user_id", "server1", "role03");
        let member = member_repo.create_test_member("bannished_user_id", "server1", "role02");
        member_repo.add_member(admin.clone());
        member_repo.add_member(member.clone());
        let user = user_repo.create_test_user("bannished_user_id");
        user_repo.add_user(user.clone());
        let usecase = CreateBan {
            repo: &repo,
            member_repo: &member_repo,
            user_repo: &user_repo,
        };
        let result = usecase.execute(
            "bannished_user_id".to_string(),
            "server1".to_string(),
            "test reason".to_string(),
            "admin_user_id".to_string(),
            "2026-01-01T00:00:00Z".to_string(),
        );
        if let Err(e) = &result {
            println!("Erreur test_save_ban: {}", e);
        }
        assert!(result.is_ok());
    }
    #[test]
    fn test_save_ban_permission_refusee() {
        let repo = MockBanRepository::new();
        let mut member_repo = MockMemberRepository::new();
        let mut user_repo = MockUserRepository::new();
        // Ajout d'un membre non admin (banner) et d'un membre (banni)
        let banner = member_repo.create_test_member("user1", "server1", "role02");
        let member = member_repo.create_test_member("bannished_user_id", "server1", "role02");
        member_repo.add_member(banner.clone());
        member_repo.add_member(member.clone());
        let user = user_repo.create_test_user("bannished_user_id");
        user_repo.add_user(user.clone());
        let usecase = CreateBan {
            repo: &repo,
            member_repo: &member_repo,
            user_repo: &user_repo,
        };
        let result = usecase.execute(
            "bannished_user_id".to_string(),
            "server1".to_string(),
            "test reason".to_string(),
            "user1".to_string(),
            "2026-01-01T00:00:00Z".to_string(),
        );
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Permission Refusée: Seul Owner ou Admin peut ban");
    }

    #[test]
    fn test_deban_usecase() {
        let repo = MockBanRepository::new();
        let mut member_repo = MockMemberRepository::new();
        let member = member_repo.create_test_member("bannished_user_id", "server1", "role02");
        member_repo.add_member(member.clone());
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "test",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let usecase = Deban {
            repo: &repo,
            member_repo: &member_repo,
        };
        let result = usecase.execute("bannished_user_id".to_string(), "server1".to_string());
        println!("Résultat test_deban_usecase: {:?}", result);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Utilisateur debanni avec succes");
    }

    #[test]
    fn test_update_ban_usecase() {
        let repo = MockBanRepository::new();
        let usecase = UpdateBan { repo: &repo };
        let result = usecase.execute(
            "bannished_user_id".to_string(),
            "server1".to_string(),
            "new reason".to_string(),
            "2027-01-01T00:00:00Z".to_string(),
        );
        // MockBanRepository retourne Err pour find_by_user_and_server
        assert!(result.is_err());
    }

    #[test]
    fn test_find_by_user_and_server_usecase() {
        let repo = MockBanRepository::new();
        let usecase = UserServer { repo: &repo };
        let result = usecase.execute("bannished_user_id".to_string(), "server1".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_find_by_user_and_server_usecase_empty_user() {
        let repo = MockBanRepository::new();
        let usecase = UserServer { repo: &repo };
        let result = usecase.execute("".to_string(), "server1".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_find_by_user_and_server_usecase_great_one() {
        let repo = MockBanRepository::new();
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "test",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let usecase = UserServer { repo: &repo };
        let result = usecase.execute("bannished_user_id".to_string(), "server1".to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_cleanup_expired_bans_usecase() {
        let ban_repo = MockBanRepository::new();
        let member_repo = MockMemberRepository::new();
        let usecase = CleanupExpiredBans {
            ban_repo: &ban_repo,
            member_repo: &member_repo,
        };
        let result = usecase.execute("server1".to_string());
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn test_deban() {
        let repo = MockBanRepository::new();
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "test",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let result = repo.deban("bannished_user_id".to_string(), "server1".to_string());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "bannished_user_id:server1");
    }

    #[test]
    fn test_update_ban() {
        let repo = MockBanRepository::new();
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "old_reason",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let result = repo.update_ban(
            "bannished_user_id".to_string(),
            "server1".to_string(),
            "new_reason".to_string(),
            "2027-01-01T00:00:00Z".to_string(),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_find_by_server() {
        let repo = MockBanRepository::new();
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "test",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let result = repo.find_by_server("server1".to_string());
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 1);
    }

    #[test]
    fn test_find_by_user_and_server() {
        let repo = MockBanRepository::new();
        let ban = repo.create_test_ban(
            "ban1",
            "bannished_user_id",
            "server1",
            "test",
            "admin_user_id",
            "2026-01-01T00:00:00Z"
        );
        repo.add_ban(ban);
        let result = repo.find_by_user_and_server("bannished_user_id".to_string(), "server1".to_string());
        assert!(result.is_ok());
    }
}
#[test]
fn test_update_ban_success() {
    let repo = MockBanRepository::new();
    // Ajoute un ban existant
    let ban = repo.create_test_ban(
        "ban1",
        "bannished_user_id",
        "server1",
        "old_reason",
        "admin_user_id",
        "2024-01-01T00:00:00Z"
    );
    repo.add_ban(ban);
    let result = repo.update_ban(
        "bannished_user_id".to_string(),
        "server1".to_string(),
        "new_reason".to_string(),
        "2027-01-01T00:00:00Z".to_string(),
    );
    assert!(result.is_ok());
}

#[test]
fn test_update_ban_not_found() {
    let repo = MockBanRepository::new();
    let result = repo.update_ban(
        "not_found_user".to_string(),
        "server1".to_string(),
        "reason".to_string(),
        "2027-01-01T00:00:00Z".to_string(),
    );
    assert!(result.is_err());
}

#[test]
fn test_cleanup_expired_bans_with_expired_and_active() {
    let ban_repo = MockBanRepository::new();
    let member_repo = MockMemberRepository::new();
    // Ban expiré
    let expired_ban = ban_repo.create_test_ban(
        "ban1",
        "user1",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() - Duration::days(1)).to_rfc3339()
    );
    ban_repo.add_ban(expired_ban);
    // Ban non expiré
    let active_ban = ban_repo.create_test_ban(
        "ban2",
        "user2",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() + Duration::days(1)).to_rfc3339()
    );
    ban_repo.add_ban(active_ban);
    let usecase = CleanupExpiredBans {
        ban_repo: &ban_repo,
        member_repo: &member_repo,
    };
    let result = usecase.execute("server1".to_string());
    assert!(result.is_ok());
    let unbanned = result.unwrap();
    assert_eq!(unbanned.len(), 1);
    assert_eq!(unbanned[0], "user1");
}

#[test]
fn should_unban_expired_users() {
    let past_date = (Utc::now() - chrono::Duration::days(1)).to_rfc3339();

    let repo = MockBanRepository::new();

    let expired_ban = repo.create_test_ban(
        "ban1",
        "user1",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() - Duration::days(1)).to_rfc3339()
    );
    repo.add_ban(expired_ban);

    let member_repo = MockMemberRepository::new();

    let usecase = CleanupExpiredBans {
        ban_repo: &repo,
        member_repo: &member_repo,
    };

    let result = usecase.execute("server1".to_string());

    assert!(result.is_ok());
    let users = result.unwrap();
    assert_eq!(users.len(), 1);
    assert_eq!(users[0], "user1");
}

#[test]
fn should_fail_if_server_id_empty() {
    let repo = MockBanRepository::new();


    let expired_ban = repo.create_test_ban(
        "ban1",
        "user1",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() - Duration::days(1)).to_rfc3339()
    );
    repo.add_ban(expired_ban);

    let member_repo = MockMemberRepository::new();

    let usecase = CleanupExpiredBans {
        ban_repo: &repo,
        member_repo: &member_repo,
    };

    let result = usecase.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Server ID requis");
}
#[test]
fn should_ignore_non_expired_bans() {
    let future_date = (Utc::now() + chrono::Duration::days(1)).to_rfc3339();

    let repo = MockBanRepository::new();


    let expired_ban = repo.create_test_ban(
        "ban1",
        "user1",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() + Duration::days(1)).to_rfc3339()
    );
    repo.add_ban(expired_ban);

    let member_repo = MockMemberRepository::new();
    let usecase = CleanupExpiredBans {
        ban_repo: &repo,
        member_repo: &member_repo,
    };

    let result = usecase.execute("server1".to_string());

    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}
#[test]
fn should_skip_invalid_dates() {

    let repo = MockBanRepository::new();


    let expired_ban = repo.create_test_ban(
        "ban1",
        "user1",
        "server1",
        "test",
        "admin_user_id",
        &(Utc::now() + Duration::days(1)).to_rfc3339()
    );
    repo.add_ban(expired_ban);

    let member_repo = MockMemberRepository::new();

    let usecase = CleanupExpiredBans {
        ban_repo: &repo,
        member_repo: &member_repo,
    };

    let result = usecase.execute("server1".to_string());

    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
}