use crate::domain::entities::{
    channel::Channel, member::Member, message::Message, role::Role, server::Server, user::User, reaction::Reaction
};
use crate::domain::entities::reagi::Reagi;
use crate::domain::ports::{
    reaction_repository::ReactionRepository, reagi_repository::ReagiRepository,
    channel_repository::ChannelRepository, member_repository::MemberRepository,
    message_repository::MessageRepository, role_repository::RoleRepository,
    server_repository::ServerRepository, user_repository::UserRepository,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
pub struct MockChannelRepository {
    channels: Arc<Mutex<HashMap<String, Channel>>>,
    should_fail: bool,
}

impl MockChannelRepository {
    pub fn new() -> Self {
        Self {
            channels: Arc::new(Mutex::new(HashMap::new())),
            should_fail: false,
        }
    }

    pub fn create_test_channel(&self, channel_id: &str, server_id: &str, name: &str) -> Channel {
        Channel {
            channel_id: channel_id.to_string(),
            server_id: server_id.to_string(),
            name: name.to_string(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    pub fn add_channel(&self, channel: Channel) {
        self.channels
            .lock()
            .unwrap()
            .insert(channel.channel_id.clone(), channel);
    }
}
impl ChannelRepository for MockChannelRepository {
    fn save(&self, channel: Channel) -> Result<Channel, String> {
        let mut channels = self.channels.lock().unwrap();
        channels.insert(channel.channel_id.clone(), channel.clone());
        Ok(channel)
    }

    fn find_by_id(&self, channel_id: String) -> Result<Channel, String> {
        self.channels
            .lock()
            .unwrap()
            .get(&channel_id)
            .cloned()
            .ok_or_else(|| "Channel not found".to_string())
    }

    fn find_by_server(&self, server_id: String) -> Result<Vec<Channel>, String> {
        let channels: Vec<Channel> = self
            .channels
            .lock()
            .unwrap()
            .values()
            .filter(|c| c.server_id == server_id)
            .cloned()
            .collect();
        Ok(channels)
    }

    fn update(&self, channel: Channel) -> Result<Channel, String> {
        let mut channels = self.channels.lock().unwrap();
        if channels.contains_key(&channel.channel_id) {
            channels.insert(channel.channel_id.clone(), channel.clone());
            Ok(channel)
        } else {
            Err("Channel not found".to_string())
        }
    }

    fn delete_channel(&self, channel_id: String) -> Result<String, String> {
        let mut channels = self.channels.lock().unwrap();
        if channels.remove(&channel_id).is_some() {
            return Ok(channel_id);
        }
        Err("Channel not found".to_string())
    }
}

pub struct MockServerRepository {
    servers: Arc<Mutex<HashMap<String, Server>>>,
    members: Arc<Mutex<HashMap<String, Member>>>,
}

impl MockServerRepository {
    pub fn new() -> Self {
        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
            members: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_test_server(&self, server_id: &str, name: &str, password: &str) -> Server {
        return Server {
            server_id: server_id.to_string(),
            name: name.to_string(),
            invite_code: format!("invite-{}", server_id),
            password: password.to_string(),
            all_channels: Vec::new(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
        };
    }

    pub fn add_server(&self, server: Server) {
        self.servers
            .lock()
            .unwrap()
            .insert(server.server_id.clone(), server);
    }

    pub fn add_member(&self, member: Member) {
        self.members
            .lock()
            .unwrap()
            .insert(member.user.user_id.clone(), member);
    }
}

impl ServerRepository for MockServerRepository {
    fn save(&self, server: Server) -> Result<Server, String> {
        self.servers
            .lock()
            .unwrap()
            .insert(server.server_id.clone(), server.clone());
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
        let server_ids: Vec<String> = self
            .members
            .lock()
            .unwrap()
            .values()
            .filter(|m| m.user.user_id == user_id)
            .map(|m| m.server.server_id.clone())
            .collect();

        if server_ids.is_empty() {
            return Ok(vec![]);
        }

        let servers_result: Vec<Server> = self
            .servers
            .lock()
            .unwrap()
            .values()
            .filter(|s| server_ids.contains(&s.server_id))
            .cloned()
            .collect();

        Ok(servers_result)
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
            return Ok(server);
        }
        Err("Server not found".to_string())
    }
}

pub struct MockMessageRepository {
    messages: Arc<Mutex<HashMap<String, Message>>>,
    users: Arc<Mutex<HashMap<String, User>>>,
}

impl MockMessageRepository {
    pub fn new() -> Self {
        Self {
            messages: Arc::new(Mutex::new(HashMap::new())),
            users: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_test_message(
        &self,
        message_id: &str,
        channel_id: &str,
        user_id: &str,
        content: &str,
    ) -> Message {
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
            is_gif: false,
            reactions: Vec::new(),
        }
    }
    pub fn add_message(&self, message: Message) {
        self.messages
            .lock()
            .unwrap()
            .insert(message.message_id.clone(), message);
    }
}

impl MessageRepository for MockMessageRepository {
    fn save(&self, message: Message) -> Result<Message, String> {
        self.messages
            .lock()
            .unwrap()
            .insert(message.message_id.clone(), message.clone());
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
            return Ok(message);
        }
        Err("Message not found".to_string())
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

pub struct MockUserRepository {
    users: Arc<Mutex<HashMap<String, User>>>,
}
impl MockUserRepository {
    pub fn new() -> Self {
        let repo = Self {
            users: Arc::new(Mutex::new(HashMap::new())),
        };
        repo.add_user(User {
            user_id: "user-test".to_string(),
            username: format!("user-test"),
            email: format!("user@example.com"),
            create_at: "2024-01-01T00:00:00Z".to_string(),
            password: "password".to_string(),
            token: None,
        });
        repo
    }

    pub fn create_test_user(&self, user_id: &str) -> User {
        User {
            user_id: user_id.to_string(),
            username: format!("User {}", user_id),
            email: format!("user{}@example.com", user_id),
            password: "password".to_string(),
            create_at: "2024-01-01T00:00:00Z".to_string(),
            token: None,
        }
    }
    pub fn add_user(&self, user: User) {
        self.users
            .lock()
            .unwrap()
            .insert(user.user_id.clone(), user);
    }
}

impl UserRepository for MockUserRepository {
    fn save(&self, user: User) -> Result<User, String> {
        self.users
            .lock()
            .unwrap()
            .insert(user.user_id.clone(), user.clone());
        Ok(user)
    }
    fn find_by_id(&self, user_id: std::string::String) -> Result<User, String> {
        let users = self.users.lock().unwrap();
        users
            .get(&user_id)
            .cloned()
            .ok_or_else(|| "User not found".to_string())
    }
    fn update_token(
        &self,
        user_id: std::string::String,
        token: Option<String>,
    ) -> Result<(), std::string::String> {
        let mut users = self.users.lock().unwrap();
        if let Some(user) = users.get_mut(&user_id) {
            user.token = token.clone();
            Ok(())
        } else {
            Err("User not found".to_string())
        }
    }
    fn find_by_username(&self, username: String) -> Result<User, String> {
        let users = self.users.lock().unwrap();
        users
            .values()
            .find(|u| u.username == username)
            .cloned()
            .ok_or_else(|| "User not found".to_string())
    }
}

pub struct MockMemberRepository {
    members: Arc<Mutex<Vec<Member>>>,
}

impl MockMemberRepository {
    pub fn new() -> Self {
        Self {
            members: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn create_test_member(&self, user_id: &str, server_id: &str, role_id: &str) -> Member {
        let (role_id, role_name) = match role_id {
            "role01" => ("role01", "Ban"),
            "role02" => ("role02", "Membre"),
            "role03" => ("role03", "Admin"),
            "role04" => ("role04", "Owner"),
            _ => ("role-default", "Member"),
        };
        Member {
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
                role_id: role_id.to_string(),
                role_name: role_name.to_string(),
            },
            join_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }
    pub fn add_member(&self, member: Member) {
        self.members.lock().unwrap().push(member);
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
        Ok(format!(
            "Deleted member {} from server {}",
            user_id, server_id
        ))
    }

    fn update_member_role(
        &self,
        user_id: String,
        server_id: String,
        _role_id: String,
    ) -> Result<String, String> {
        Ok(format!(
            "Role updated for user {} in server {}",
            user_id, server_id
        ))
    }
}

pub struct MockRoleRepository {
    roles: Arc<Mutex<HashMap<String, Role>>>,
}

impl MockRoleRepository {
    pub fn new() -> Self {
        let repo = Self {
            roles: Arc::new(Mutex::new(HashMap::new())),
        };
        repo.add_role(Role {
            role_id: "role01".to_string(),
            role_name: "Ban".to_string(),
        });
        repo.add_role(Role {
            role_id: "role02".to_string(),
            role_name: "Membre".to_string(),
        });
        repo.add_role(Role {
            role_id: "role03".to_string(),
            role_name: "Admin".to_string(),
        });
        repo.add_role(Role {
            role_id: "role04".to_string(),
            role_name: "Owner".to_string(),
        });
        repo
    }

    pub fn add_role(&self, role: Role) {
        self.roles
            .lock()
            .unwrap()
            .insert(role.role_id.clone(), role);
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
    fn find_by_name(&self, name: String) -> Result<Role, String> {
        self.roles
            .lock()
            .unwrap()
            .values()
            .find(|r| r.role_name == name)
            .cloned()
            .ok_or_else(|| "Role not found".to_string())
    }
}

pub struct MockReactionRepository {
    reactions: Arc<Mutex<HashMap<String, Reaction>>>,
}

impl MockReactionRepository {

    pub fn add_reaction(&self, reaction: Reaction) {
        self.reactions
            .lock()
            .unwrap()
            .insert(reaction.reaction_id.to_string(), reaction);
    }

    pub fn new() -> Self {
        let repo = Self {
            reactions: Arc::new(Mutex::new(HashMap::new())),
        };
        repo.add_reaction(Reaction {
            reaction_id: 1,
            emoji: "👍".to_string(),
            reaction_name: "Like".to_string(),
        });
        repo.add_reaction(Reaction {
            reaction_id: 2,
            emoji: "👎".to_string(),
            reaction_name: "Dislike".to_string(),
        });
        repo.add_reaction(Reaction {
            reaction_id: 3,
            emoji: "❤️".to_string(),
            reaction_name: "Love".to_string(),
        });
        repo.add_reaction(Reaction {
            reaction_id: 4,
            emoji: "🎉".to_string(),
            reaction_name: "Celebrate".to_string(),
        });
        repo
    }
}

impl ReactionRepository for MockReactionRepository {
    fn save(&self, reaction: Reaction) -> Result<Reaction, String> {
        self.reactions
            .lock()
            .unwrap()
            .insert(format!("{}", reaction.reaction_id), reaction.clone());
        Ok(reaction)
    }
    fn exists(&self, reaction_id: i32) -> Result<bool, String> {
        let exists = self
            .reactions
            .lock()
            .unwrap()
            .contains_key(&reaction_id.to_string());
        if exists {
            Ok(exists)
        } else {
            Err("Reaction not found".to_string())
        }
    }
    fn find_by_id(&self, reaction_id: i32) -> Result<Reaction, String> {
        self.reactions
            .lock()
            .unwrap()
            .get(&reaction_id.to_string())
            .cloned()
            .ok_or_else(|| "Reaction not found".to_string())
    }
    fn find_all(&self) -> Result<Vec<Reaction>, String> {
        let reactions: Vec<Reaction> = self
            .reactions
            .lock()
            .unwrap()
            .values()
            .cloned()
            .collect();
        Ok(reactions)
    }
}

pub struct MockReagiRepository {
    reagis: Arc<Mutex<HashMap<String, Reagi>>>,
}
impl MockReagiRepository {
    pub fn new() -> Self {
        Self {
            reagis: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn add_reagi(&self, reagi: Reagi) {
        let key = format!("{}-{}-{}", reagi.user.user_id, reagi.message.message_id, reagi.reaction.reaction_id);
        self.reagis.lock().unwrap().insert(key, reagi);
    }
}

impl ReagiRepository for MockReagiRepository {
    fn save(&self, reagi: Reagi) -> Result<Reagi, String> {
        let key = format!("{}-{}-{}", reagi.user.user_id, reagi.message.message_id, reagi.reaction.reaction_id);
        self.reagis.lock().unwrap().insert(key, reagi.clone());
        Ok(reagi)
    }

    fn exists(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<bool, String> {
        let key = format!("{}-{}-{}", user_id, message_id, reaction_id);
        let exists = self.reagis.lock().unwrap().contains_key(&key);
        if exists {
            Ok(exists)
        } else {
            Err("Reagi not found".to_string())
        }
    }

    fn find_by_message_id(&self, message_id: String) -> Result<Vec<Reagi>, String> {
        let result: Vec<Reagi> = self.reagis.lock().unwrap()
            .values()
            .filter(|r| r.message.message_id == message_id)
            .cloned()
            .collect();
        Ok(result)
    }

    fn delete_reaction(&self, user_id: String, message_id: String, reaction_id: i32) -> Result<String, String> {
        let key = format!("{}-{}-{}", user_id, message_id, reaction_id);
        let mut reagis = self.reagis.lock().unwrap();
        if reagis.remove(&key).is_some() {
            Ok("removed".to_string())
        } else {
            Err("Reagi not found".to_string())
        }
    }
}


