use crate::domain::entities::message::Message;
use crate::domain::entities::user::User;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::message::{
    send_message::SendMessage,
    delete_message::DeleteMessage,
    list_message::ListMessage,
    update_message::UpdateMessage,
};
use crate::test_unitaire::mock_repositories::MockUserRepository;
use crate::test_unitaire::mock_repositories::MockMessageRepository;
use crate::test_unitaire::mock_repositories::MockChannelRepository;
use crate::test_unitaire::mock_repositories::MockMemberRepository;
use crate::test_unitaire::mock_repositories::MockRoleRepository;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_send_message() {
        let repo = MockMessageRepository::new();
        let repo_user = MockUserRepository::new(); 
        repo_user.save(repo_user.create_test_user("user-1"));

        let use_case = SendMessage { repo_message: &repo, repo_user: &repo_user };

        let result = use_case.execute(
            "channel-1".to_string(),
            "user-1".to_string(),
            "Hello!".to_string(),
        );

        assert!(result.is_ok());
        let message = result.unwrap();
        assert_eq!(message.channel_id, "channel-1");
        assert_eq!(message.user.user_id, "user-1");
        assert_eq!(message.content, "Hello!");
        assert!(!message.message_id.is_empty());
    }

    #[test]
    fn test_send_message_empty() {
        let repo = MockMessageRepository::new();
        let repo_user = MockUserRepository::new(); 
        let use_case = SendMessage { repo_message: &repo, repo_user: &repo_user };

        let result = use_case.execute(
            "".to_string(),
            "".to_string(),
            "".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Le contenu du message ne peut pas être vide");
    }

    #[test]
    fn test_list_message() {
        let repo = MockMessageRepository::new();
        
        repo.add_message(repo.create_test_message("msg-1", "channel-1", "user-1", "Hello"));
        repo.add_message(repo.create_test_message("msg-2", "channel-1", "user-2", "Hi"));
        repo.add_message(repo.create_test_message("msg-3", "channel-2", "user-1", "Other"));

        let use_case = ListMessage { repo: &repo };
        let result = use_case.execute("channel-1".to_string());

        assert!(result.is_ok());
        let messages = result.unwrap();
        assert_eq!(messages.len(), 2);
        assert!(messages.iter().all(|m| m.channel_id == "channel-1"));
    }

    #[test]
    fn test_list_message_empty() {
        let repo = MockMessageRepository::new();
        let use_case = ListMessage { repo: &repo };

        let result = use_case.execute("".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "L'ID du channel est requis");
    }

    #[test]
    fn test_list_message_none() {
        let repo = MockMessageRepository::new();
        let use_case = ListMessage { repo: &repo };

        let result = use_case.execute("channel-empty".to_string());

        assert!(result.is_ok());
        let messages = result.unwrap();
        assert_eq!(messages.len(), 0);
    }

    #[test]
    fn test_delete_message() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "général");
        channel_repo.add_channel(channel);
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Hello");
        message_repo.add_message(message);

        let use_case = DeleteMessage { message_repo: &message_repo, channel_repo: &channel_repo, member_repo: &member_repo };
        let result = use_case.execute("".to_string(), "user-1".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "L'ID du message est requis");
    }
    #[test]
    fn test_author_deletes_own_message() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "général");
        channel_repo.add_channel(channel);
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Hello");
        message_repo.add_message(message);

        let use_case = DeleteMessage { message_repo: &message_repo, channel_repo: &channel_repo, member_repo: &member_repo };
        let result = use_case.execute("msg-1".to_string(), "user-1".to_string());

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "channel-1");
    }

    #[test]
    fn test_delete_message_empty() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Test");
        message_repo.add_message(message);

        let channel = channel_repo.create_test_channel("channel-1", "server-123", "general");
        channel_repo.add_channel(channel);
        let member = member_repo.create_test_member("user-1", "server-123", "role04");
        member_repo.add_member(member);

        let use_case = DeleteMessage { message_repo: &message_repo, channel_repo: &channel_repo, member_repo: &member_repo };

        let result = use_case.execute("".to_string(), "user-1".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "L'ID du message est requis");
    }

    #[test]
    fn test_delete_message_none() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Test");
        message_repo.add_message(message);

        let channel = channel_repo.create_test_channel("channel-1", "server-123", "general");
        channel_repo.add_channel(channel);
        let member = member_repo.create_test_member("user-1", "server-123", "role04");
        member_repo.add_member(member);
        let use_case = DeleteMessage { message_repo: &message_repo, channel_repo: &channel_repo, member_repo: &member_repo };

        let result = use_case.execute("non-existent".to_string(), "user-1".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Message not found");
    }

    #[test]
    fn test_delete_message_unauthorized() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Test");
        message_repo.add_message(message);

        let channel = channel_repo.create_test_channel("channel-1", "server-123", "general");
        channel_repo.add_channel(channel);

        let member = member_repo.create_test_member("user-1", "server-123", "role02");
        member_repo.add_member(member);
        
        let author = member_repo.create_test_member("user-1", "server-1", "role02");
        member_repo.add_member(author);

        let other = member_repo.create_test_member("user-2", "server-1", "role02");
        member_repo.add_member(other);

        let use_case = DeleteMessage {
            message_repo: &message_repo,
            channel_repo: &channel_repo,
            member_repo: &member_repo,
        };

        let result = use_case.execute("msg-1".to_string(), "user-2".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Vous n'êtes pas membre de ce serveur");
    }

    #[test]
    fn test_admin_cannot_delete_owner_message() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "général");
        channel_repo.add_channel(channel);

        // Le message est écrit par un Owner
        let msg = message_repo.create_test_message("msg-2", "channel-1", "user-owner", "Hello");
        message_repo.add_message(msg);

        let owner = member_repo.create_test_member("user-owner", "server-1", "role04");
        member_repo.add_member(owner);

        let admin = member_repo.create_test_member("user-admin", "server-1", "role03");
        member_repo.add_member(admin);

        let use_case = DeleteMessage {
            message_repo: &message_repo,
            channel_repo: &channel_repo,
            member_repo: &member_repo,
        };

        let result = use_case.execute("msg-2".to_string(), "user-admin".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Permission refusée: vous ne pouvez pas supprimer ce message");
    }

    #[test]
    fn test_delete_message_not_found() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();
        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Test");
        message_repo.add_message(message);

        let channel = channel_repo.create_test_channel("channel-1", "server-123", "general");
        channel_repo.add_channel(channel);


        let use_case = DeleteMessage {
            message_repo: &message_repo,
            channel_repo: &channel_repo,
            member_repo: &member_repo,
        };

        let result = use_case.execute("msg-inexistant".to_string(), "user-1".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Message not found");
    }

    #[test]
    fn test_author_updates_own_message() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "general");
        channel_repo.add_channel(channel);

        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Contenu original");
        message_repo.add_message(message);

        let use_case = UpdateMessage {
            message_repo : &message_repo,
            channel_repo : &channel_repo,
            member_repo : &member_repo,
        };

        let result = use_case.execute(
            "msg-1".to_string(),
            "user-1".to_string(),
            "Nouveau contenu".to_string(),
        );

        assert!(result.is_ok());
        let (channel_id, message_id, username) = result.unwrap();
        assert_eq!(channel_id, "channel-1");
        assert_eq!(message_id, "msg-1");
        assert_eq!(username, "User user-1");
    }

    #[test]
    fn test_other_user_cannot_update_message() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "general");
        channel_repo.add_channel(channel);

        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Contenu original");
        message_repo.add_message(message);

        let use_case = UpdateMessage {
            message_repo : &message_repo,
            channel_repo : &channel_repo,
            member_repo : &member_repo,
        };

        let result = use_case.execute(
            "msg-1".to_string(),
            "user-2".to_string(), // pas l'auteur
            "Tentative de modification".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Vous ne pouvez modifier que vos propres messages");
    }

    #[test]
    fn test_update_message_empty_id() {
        let message_repo = MockMessageRepository::new();
        let channel_repo = MockChannelRepository::new();
        let member_repo = MockMemberRepository::new();

        let channel = channel_repo.create_test_channel("channel-1", "server-1", "general");
        channel_repo.add_channel(channel);

        let message = message_repo.create_test_message("msg-1", "channel-1", "user-1", "Contenu original");
        message_repo.add_message(message);

        let use_case = UpdateMessage {
            message_repo : &message_repo,
            channel_repo : &channel_repo,
            member_repo : &member_repo,
        };

        let result = use_case.execute(
            "".to_string(),
            "user-1".to_string(),
            "Nouveau contenu".to_string(),
        );

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "L'ID du message est requis");
    }
}
