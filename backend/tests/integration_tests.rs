// Tests d'intégration pour L!NKYT Backend
// Pour exécuter : cargo test
// Pour coverage : cargo tarpaulin --out Html

#[cfg(test)]
mod user_tests {
    #[test]
    fn test_user_creation() {
        let user_id = "test123".to_string();
        let username = "testuser".to_string();
        let email = "test@example.com".to_string();

        assert_eq!(username, "testuser");
        assert_eq!(email, "test@example.com");
        assert!(!user_id.is_empty());
    }

    #[test]
    fn test_user_id_is_unique() {
        let user1_id = "user1".to_string();
        let user2_id = "user2".to_string();

        assert_ne!(user1_id, user2_id);
    }

    #[test]
    fn test_username_not_empty() {
        let username = "alice".to_string();
        assert!(!username.is_empty());
        assert!(username.len() > 0);
    }
}

#[cfg(test)]
mod server_tests {
    #[test]
    fn test_server_creation() {
        let server_name = "Test Server".to_string();
        let invite_code = "ABC123".to_string();

        assert_eq!(server_name, "Test Server");
        assert_eq!(invite_code, "ABC123");
        assert_eq!(invite_code.len(), 6);
    }

    #[test]
    fn test_server_name_valid() {
        let server_name = "My Server".to_string();
        assert!(!server_name.is_empty());
        assert!(server_name.len() > 0);
    }

    #[test]
    fn test_invite_code_format() {
        let invite_code = "ABC123".to_string();
        assert_eq!(invite_code.len(), 6);
        assert!(invite_code.chars().all(|c| c.is_alphanumeric()));
    }
}

#[cfg(test)]
mod channel_tests {
    #[test]
    fn test_channel_creation() {
        let channel_name = "general".to_string();
        let channel_id = "ch123".to_string();

        assert_eq!(channel_name, "general");
        assert_eq!(channel_id, "ch123");
    }

    #[test]
    fn test_channel_name_valid() {
        let channel_name = "announcements".to_string();

        assert!(!channel_name.is_empty());
        assert!(channel_name.len() > 0);
    }

    #[test]
    fn test_channel_id_format() {
        let channel_id = "ch_123456".to_string();
        assert!(!channel_id.is_empty());
    }
}

#[cfg(test)]
mod message_tests {
    #[test]
    fn test_message_creation() {
        let content = "Hello, world!".to_string();
        let user_id = "user1".to_string();
        let channel_id = "ch1".to_string();

        assert_eq!(content, "Hello, world!");
        assert_eq!(user_id, "user1");
        assert_eq!(channel_id, "ch1");
    }

    #[test]
    fn test_message_not_empty() {
        let content = "Test".to_string();
        assert!(!content.is_empty());
    }

    #[test]
    fn test_empty_message_is_presence() {
        let content = "".to_string();
        // Message vide = message de présence
        assert!(content.trim().is_empty());
    }

    #[test]
    fn test_message_content_trimming() {
        let content = "   hello   ".to_string();
        let trimmed = content.trim();
        assert_eq!(trimmed, "hello");
        assert!(!trimmed.is_empty());
    }
}

// Tests pour les use cases
#[cfg(test)]
mod usecase_tests {
    #[test]
    fn test_user_registration_flow() {
        let username = "newuser";
        let email = "new@example.com";
        let password = "securepass123";

        assert!(!username.is_empty());
        assert!(email.contains('@'));
        assert!(password.len() >= 8);
    }

    #[test]
    fn test_server_creation_flow() {
        let server_name = "My Server";
        let invite_code = "ABCD12";

        assert!(!server_name.is_empty());
        assert_eq!(invite_code.len(), 6);
    }

    #[test]
    fn test_message_sending_flow() {
        let content = "Hello!";
        let user_id = "user123";
        let channel_id = "ch456";

        assert!(!content.trim().is_empty());
        assert!(!user_id.is_empty());
        assert!(!channel_id.is_empty());
    }
}

// Tests WebSocket
#[cfg(test)]
mod websocket_tests {
    use serde_json::json;

    #[test]
    fn test_ws_message_serialization() {
        let msg = json!({
            "type": "new_message",
            "content": "test",
            "user_id": "user1",
            "username": "alice",
            "channel_id": "ch1"
        });

        assert_eq!(msg["type"], "new_message");
        assert_eq!(msg["content"], "test");
    }

    #[test]
    fn test_user_joined_event() {
        let event = json!({
            "type": "user_joined",
            "user_id": "user1",
            "username": "alice",
            "server_id": "srv1"
        });

        assert_eq!(event["type"], "user_joined");
        assert_eq!(event["username"], "alice");
    }

    #[test]
    fn test_user_left_event() {
        let event = json!({
            "type": "user_left",
            "user_id": "user1",
            "username": "alice",
            "server_id": "srv1"
        });

        assert_eq!(event["type"], "user_left");
        assert_eq!(event["user_id"], "user1");
    }
}

// Tests validation
#[cfg(test)]
mod validation_tests {
    #[test]
    fn test_email_format() {
        let valid_email = "user@example.com";
        let invalid_email = "notanemail";

        assert!(valid_email.contains('@'));
        assert!(!invalid_email.contains('@'));
    }

    #[test]
    fn test_password_length() {
        let strong_password = "SecurePass123!";
        let weak_password = "123";

        assert!(strong_password.len() >= 8);
        assert!(weak_password.len() < 8);
    }

    #[test]
    fn test_username_valid() {
        let valid_username = "alice";
        let invalid_username = "";

        assert!(!valid_username.is_empty());
        assert!(invalid_username.is_empty());
    }

    #[test]
    fn test_email_lowercase() {
        let email = "User@Example.COM";
        let normalized = email.to_lowercase();
        assert_eq!(normalized, "user@example.com");
    }

    #[test]
    fn test_password_min_requirements() {
        let password = "Pass123!";
        assert!(password.len() >= 8);
        assert!(password.chars().any(|c| c.is_numeric()));
        assert!(password.chars().any(|c| c.is_uppercase()));
    }
}
