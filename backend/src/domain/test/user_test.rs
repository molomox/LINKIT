 use crate::domain::entities::message::Message;
use crate::domain::entities::user::User;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::usecases::message::{
    send_message::SendMessage,
    delete_message::DeleteMessage,
    list_message::ListMessage,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

struct MockMessageRepository {
    messages: Arc<Mutex<HashMap<String, Message>>>,
    should_fail: bool,
    fail_on_operation: Option<String>, // "save", "delete", "find_by_channel"
}

impl MockMessageRepository {
    fn new() -> Self {
        Self {
            messages: Arc::new(Mutex::new(HashMap::new())),
            should_fail: false,
            fail_on_operation: None,
        }
    }
    fn with_failure() -> Self {
        Self {
            messages: Arc::new(Mutex::new(HashMap::new())),
            should_fail: true,
            fail_on_operation: None,
        }
    }

    fn with_specific_failure(operation: &str) -> Self {
        Self {
            messages: Arc::new(Mutex::new(HashMap::new())),
            should_fail: false,
            fail_on_operation: Some(operation.to_string()),
        }
    }

    fn add_message(&self, message: Message) {
        self.messages.lock().unwrap().insert(message.message_id.clone(), message);
    }

    fn count_messages_in_channel(&self, channel_id: &str) -> usize {
        self.messages
            .lock()
            .unwrap()
            .values()
            .filter(|m| m.channel_id == channel_id)
            .count()
    }

    fn message_exists(&self, message_id: &str) -> bool {
        self.messages.lock().unwrap().contains_key(message_id)
    }
}

impl MessageRepository for MockMessageRepository {
    fn save(&self, message: Message) -> Result<Message, String> {
        if self.should_fail || self.fail_on_operation.as_deref() == Some("save") {
            return Err("Database error while saving".to_string());
        }
        let mut messages = self.messages.lock().unwrap();
        messages.insert(message.message_id.clone(), message.clone());
        Ok(message)
    }

    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String> {
        if self.should_fail || self.fail_on_operation.as_deref() == Some("find_by_channel") {
            return Err("Database error while fetching".to_string());
        }
        let messages: Vec<Message> = self
            .messages
            .lock()
            .unwrap()
            .values()
            .filter(|m| m.channel_id == channel_id)
            .cloned()
            .collect();
        Ok(messages)
    }

    fn delete(&self, message_id: String) -> Result<String, String> {
        if self.should_fail || self.fail_on_operation.as_deref() == Some("delete") {
            return Err("Database error while deleting".to_string());
        }
        let mut messages = self.messages.lock().unwrap();
        if messages.remove(&message_id).is_some() {
            Ok(message_id)
        } else {
            Err("Message not found".to_string())
        }
    }

    fn update(&self, message: Message) -> Result<Message, String> {
        if self.should_fail {
            return Err("Database error while updating".to_string());
        }
        let mut messages = self.messages.lock().unwrap();
        if messages.contains_key(&message.message_id) {
            messages.insert(message.message_id.clone(), message.clone());
            Ok(message)
        } else {
            Err("Message not found".to_string())
        }
    }
}

#[test]
fn test_send_message() {
    let repo = MockMessageRepository::new();
    let use_case = SendMessage { repo: &repo };

    let result = use_case.execute(
        "channel-123".to_string(),
        "user-456".to_string(),
        "Hello, world!".to_string(),
    );

    assert!(result.is_ok());
    let message = result.unwrap();
    assert_eq!(message.channel_id, "channel-123");
    assert_eq!(message.user.user_id, "user-456");
    assert_eq!(message.content, "Hello, world!");
    assert!(!message.message_id.is_empty());
    assert!(!message.create_at.is_empty());
}

#[test]
fn test_send_message_empty() {
    let repo = MockMessageRepository::new();
    let use_case = SendMessage { repo: &repo };

    let result = use_case.execute(
        "".to_string(),
        "".to_string(),
        "".to_string(),
    );

    assert!(result.is_err());
    // Vérifie que la première validation échoue (content)
    assert_eq!(result.unwrap_err(), "Le contenu du message ne peut pas être vide");
}

#[test]
fn test_list_message() {
    let repo = MockMessageRepository::new();
    
    repo.add_message(create_test_message("msg-1", "channel-123", "user-1", "First"));
    repo.add_message(create_test_message("msg-2", "channel-123", "user-2", "Second"));
    repo.add_message(create_test_message("msg-3", "channel-456", "user-3", "Other"));

    let use_case = ListMessage { repo: &repo };
    let result = use_case.execute("channel-123".to_string());

    assert!(result.is_ok());
    let messages = result.unwrap();
    assert_eq!(messages.len(), 2);
    assert!(messages.iter().all(|m| m.channel_id == "channel-123"));
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

    let result = use_case.execute("channel-999".to_string());

    assert!(result.is_ok());
    let messages = result.unwrap();
    assert_eq!(messages.len(), 0);
}

#[test]
fn test_delete_message() {
    let repo = MockMessageRepository::new();
    let message = create_test_message("msg-123", "channel-1", "user-1", "Test");
    repo.add_message(message);

    let use_case = DeleteMessage { repo: &repo };
    let result = use_case.execute("msg-123".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "msg-123");
    assert!(!repo.message_exists("msg-123"));
}

#[test]
fn test_delete_message_empty() {
    let repo = MockMessageRepository::new();
    let use_case = DeleteMessage { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "L'ID du message est requis");
}

#[test]
fn test_delete_message_none() {
    let repo = MockMessageRepository::new();
    let use_case = DeleteMessage { repo: &repo };

    let result = use_case.execute("non-existent-id".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Message not found");
}