use crate::domain::entities::message::Message;
use crate::domain::entities::user::User;
use crate::domain::ports::message_repository::MessageRepository;
use crate::domain::ports::user_repository::UserRepository;
use crate::domain::usecases::message::{
    send_message::SendMessage,
    delete_message::DeleteMessage,
    list_message::ListMessage,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

struct MockMessageRepository {
    messages: Arc<Mutex<HashMap<String, Message>>>,
    users: Arc<Mutex<HashMap<String, User>>>,
}

impl MockMessageRepository {
    fn new() -> Self {
        Self {
            messages: Arc::new(Mutex::new(HashMap::new())),
            users: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn create_test_message(&self, message_id: &str, channel_id: &str, user_id: &str, content: &str) -> Message {
        Message {
            message_id: message_id.to_string(),
            channel_id: channel_id.to_string(),
            content: content.to_string(),
            user: User {
                user_id: user_id.to_string(),
                username: format!("User {}", user_id),
                email: format!("user{}@example.com", user_id),
                create_at: "2024-01-01T00:00:00Z".to_string(),
                password: "password".to_string(),
                token: None,
            },
            create_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }
    fn add_message(&self, message: Message) {
        self.messages.lock().unwrap().insert(message.message_id.clone(), message);
    }
}

impl MessageRepository for MockMessageRepository {
    fn save(&self, message: Message) -> Result<Message, String> {
        self.messages.lock().unwrap().insert(message.message_id.clone(), message.clone());
        Ok(message)
    }

    fn find_by_channel(&self, channel_id: String) -> Result<Vec<Message>, String> {
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
        self.messages
            .lock()
            .unwrap()
            .remove(&message_id)
            .map(|_| message_id)
            .ok_or_else(|| "Message not found".to_string())
    }
    fn update(&self, message: Message) -> Result<Message, String> {
        let mut messages = self.messages.lock().unwrap();
        if messages.contains_key(&message.message_id) {
            messages.insert(message.message_id.clone(), message.clone());
            Ok(message)
        } else {
            Err("Message not found".to_string())
        }
    }

    fn find_by_id(&self, message_id: String) -> Result<Message, String> {
        self.messages
            .lock()
            .unwrap()
            .get(&message_id)
            .cloned()
            .ok_or_else(|| "Message not found".to_string())
    }
}
struct MockUserRepository {
    users: Arc<Mutex<HashMap<String, User>>>,
}
impl MockUserRepository {
    fn new() -> Self {
        Self {
            users: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn create_test_user(&self, user_id: &str) -> User {
        User {
            user_id: user_id.to_string(),
            username: format!("User {}", user_id),
            email: format!("user{}@example.com", user_id),
            password: "password".to_string(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
            token: None,
        }
    }
}

impl UserRepository for MockUserRepository {
    fn save(&self, user: User) -> Result<User, String> {
        self.users.lock().unwrap().insert(user.user_id.clone(), user.clone());
        Ok(user)
    }
    fn find_by_id(&self, user_id: std::string::String) -> Result<User, String> {
        let users = self.users.lock().unwrap();
        users.get(&user_id).cloned().ok_or_else(|| "User not found".to_string())
    }
    fn find_by_username(&self, username: std::string::String) -> Result<User, String> {
        let users = self.users.lock().unwrap();
        users.values().find(|u| u.username == username).cloned().ok_or_else(|| "User not found".to_string())
    }   
    fn find_by_email(&self, email: std::string::String) -> Result<User, String> {
        let users = self.users.lock().unwrap();
        users.values().find(|u| u.email == email).cloned().ok_or_else(|| "User not found".to_string())
    }
    fn delete(&self, user_id: std::string::String) -> Result<String, std::string::String> {
        self.users
            .lock()
            .unwrap()
            .remove(&user_id)
            .map(|_| user_id.to_string())
            .ok_or_else(|| "User not found".to_string())
    }
    fn update(&self, user: User) -> Result<User, std::string::String> {
        let mut users = self.users.lock().unwrap();
        if users.contains_key(&user.user_id) {
            users.insert(user.user_id.clone(), user.clone());
            Ok(user)
        } else {
            Err("User not found".to_string())
        }
    }
    fn exist (&self, user_id: std::string::String) -> Result<bool, std::string::String> {
        let users = self.users.lock().unwrap();
        Ok(users.contains_key(&user_id))
    }
    fn update_token(&self, user_id: std::string::String, token: Option<String>) -> Result<(), std::string::String> {
        let mut users = self.users.lock().unwrap();
        if let Some(user) = users.get_mut(&user_id) {
            user.token = token.clone();
            Ok(())
        } else {
            Err("User not found".to_string())
        }
    }
}


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
    let repo = MockMessageRepository::new();
    let message = repo.create_test_message("msg-1", "channel-1", "user-1", "Test");
    repo.add_message(message);

    let use_case = DeleteMessage { repo: &repo };
    let result = use_case.execute("msg-1".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "msg-1");
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

    let result = use_case.execute("non-existent".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Message not found");
}
