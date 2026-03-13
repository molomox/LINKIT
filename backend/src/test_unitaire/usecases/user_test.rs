use crate::domain::entities::{member::Member, role::Role, server::Server, user::User};

use crate::domain::usecases::user::find_by_username::GetUserByUsername;
use crate::domain::usecases::user::{
    create::CreateUser, find_by_id::GetUserById, login::LoginUser, logout::LogoutUser,
};
use crate::test_unitaire::mock_repositories::{
    MockMemberRepository, MockRoleRepository, MockServerRepository, MockUserRepository,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_create_user() {
        let repo = MockUserRepository::new();
        let use_case = CreateUser { repo: &repo };

        let result = use_case.execute(
            "alice".to_string(),
            "password123".to_string(),
            "alice@example.com".to_string(),
        );

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "alice");
        assert_eq!(user.email, "alice@example.com");
        assert_eq!(user.password, "password123");
        assert!(!user.user_id.is_empty());
        assert!(!user.create_at.is_empty());
        assert!(user.token.is_none());
    }

    #[test]
    fn test_create_user_empty() {
        let repo = MockUserRepository::new();
        let use_case = CreateUser { repo: &repo };

        let result = use_case.execute("".to_string(), "".to_string(), "".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Remplir tous les champs");
    }

    #[test]
    fn test_get_user_by_id_success() {
        let repo = MockUserRepository::new();
        let use_case = GetUserById { repo: &repo };

        let result = use_case.execute("user-test".to_string());

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.user_id, "user-test");
    }

    #[test]
    fn test_get_user_by_id_empty() {
        let repo = MockUserRepository::new();
        let use_case = GetUserById { repo: &repo };

        let result = use_case.execute("".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Mettre un id valide");
    }

    #[test]
    fn test_get_user_by_id_not_found() {
        let repo = MockUserRepository::new();
        let use_case = GetUserById { repo: &repo };

        let result = use_case.execute("user-inexistant".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "id introuvable");
    }

    #[test]
    fn test_get_user_by_username_success() {
        let repo = MockUserRepository::new();
        let use_case = GetUserByUsername { repo: &repo };

        let result = use_case.execute("user-test".to_string());

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "user-test");
    }

    #[test]
    fn test_get_user_by_username_empty() {
        let repo = MockUserRepository::new();
        let use_case = GetUserByUsername { repo: &repo };

        let result = use_case.execute("".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Mettre un username valide");
    }

    #[test]
    fn test_login_user_success() {
        let repo = MockUserRepository::new();
        // "user-test" / "password" pré-chargé dans MockUserRepository::new()
        let use_case = LoginUser { repo: &repo };

        let result = use_case.execute("user-test".to_string(), "password".to_string());

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "user-test");
        assert!(user.token.is_some());
    }

    #[test]
    fn test_login_user_empty() {
        let repo = MockUserRepository::new();
        let use_case = LoginUser { repo: &repo };

        let result = use_case.execute("".to_string(), "".to_string());

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Entrer un Utilisateur ou Mots de passe"
        );
    }

    #[test]
    fn test_login_user_not_found() {
        let repo = MockUserRepository::new();
        let use_case = LoginUser { repo: &repo };

        let result = use_case.execute("inconnu".to_string(), "password".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "User not found");
    }

    #[test]
    fn test_login_user_wrong_password() {
        let repo = MockUserRepository::new();
        let use_case = LoginUser { repo: &repo };

        let result = use_case.execute("user-test".to_string(), "mauvais_mdp".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Wrong password");
    }

    #[test]
    fn test_logout_user_success() {
        let repo = MockUserRepository::new();
        let use_case = LogoutUser { repo: &repo };

        let result = use_case.execute("user-test".to_string());

        assert!(result.is_ok());
    }

    #[test]
    fn test_logout_user_empty_id() {
        let repo = MockUserRepository::new();
        let use_case = LogoutUser { repo: &repo };

        let result = use_case.execute("".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "L'ID utilisateur est requis");
    }
}
