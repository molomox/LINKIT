use crate::domain::entities::channel::Channel;
    use crate::domain::ports::channel_repository::ChannelRepository;
    use crate::domain::usecases::channel::{
        create::CreateChannel,
        delete::DeleteChannel,
        get::GetChannelDetails,
        list_channel::ListServerChannel,
        update::UpdateChannel,
    };
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};

struct MockChannelRepository {
    channels: Arc<Mutex<HashMap<String, Channel>>>,
    should_fail: bool,
}

impl MockChannelRepository {
    fn new() -> Self {
        Self {
            channels: Arc::new(Mutex::new(HashMap::new())),
            should_fail: false,
        }
    }

    fn add_channel(&self, channel: Channel) {
        self.channels.lock().unwrap().insert(channel.channel_id.clone(), channel);
    }

    fn get_all(&self) -> Vec<Channel> {
        self.channels.lock().unwrap().values().cloned().collect()
    }
}
impl ChannelRepository for MockChannelRepository {
    fn save(&self, channel: Channel) -> Result<Channel, String> {
        if self.should_fail {
            return Err("Database error".to_string());
        }
        let mut channels = self.channels.lock().unwrap();
        channels.insert(channel.channel_id.clone(), channel.clone());
        Ok(channel)
    }

    fn find_by_id(&self, channel_id: String) -> Result<Channel, String> {
        if self.should_fail {
            return Err("Database error".to_string());
        }
        self.channels
            .lock()
            .unwrap()
            .get(&channel_id)
            .cloned()
            .ok_or_else(|| "Channel not found".to_string())
    }

    fn find_by_server(&self, server_id: String) -> Result<Vec<Channel>, String> {
        if self.should_fail {
            return Err("Database error".to_string());
        }
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
        if self.should_fail {
            return Err("Database error".to_string());
        }
        let mut channels = self.channels.lock().unwrap();
        if channels.contains_key(&channel.channel_id) {
            channels.insert(channel.channel_id.clone(), channel.clone());
            Ok(channel)
        } else {
            Err("Channel not found".to_string())
        }
    }

    fn delete_channel(&self, channel_id: String) -> Result<String, String> {
        if self.should_fail {
            return Err("Database error".to_string());
        }
        let mut channels = self.channels.lock().unwrap();
        if channels.remove(&channel_id).is_some() {
            Ok(channel_id)
        } else {
            Err("Channel not found".to_string())
        }
    }
}

#[test]
fn test_create_channel() {
    let repo = MockChannelRepository::new();
    let use_case = CreateChannel { repo: &repo };

    let result = use_case.execute(
        "general".to_string(),
        "server-123".to_string(),
    );

    assert!(result.is_ok());
    let channel = result.unwrap();
    assert_eq!(channel.name, "general");
    assert_eq!(channel.server_id, "server-123");
}
#[test]
fn test_create_channel_empty() {
    let repo = MockChannelRepository::new();
    let use_case = CreateChannel { repo: &repo };

    let result = use_case.execute("".to_string(), "".to_string());

    assert!(result.is_err());
}

#[test]
fn test_get_channel() {
    let repo = MockChannelRepository::new();
    let channel = Channel {
        channel_id: "channel-123".to_string(),
        create_at: "2024-01-01".to_string(),
        name: "general".to_string(),
        server_id: "server-123".to_string(),
    };
    repo.add_channel(channel.clone());

    let use_case = GetChannelDetails { repo: &repo };
    let result = use_case.execute("channel-123".to_string());

    assert!(result.is_ok());
    let found_channel = result.unwrap();
    assert_eq!(found_channel.channel_id, "channel-123");
    assert_eq!(found_channel.name, "general");
}

#[test]
fn test_get_channel_empty() {
    let repo = MockChannelRepository::new();
    let use_case = GetChannelDetails { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Evoyer un id valide");
}

#[test]
fn test_get_channel_not_found() {
    let repo = MockChannelRepository::new();
    let use_case = GetChannelDetails { repo: &repo };

    let result = use_case.execute("non-existent-id".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Channel not found");
}

#[test]
fn test_get_server_channels() {
    let repo = MockChannelRepository::new();
    
    repo.add_channel(Channel {
        channel_id: "channel-1".to_string(),
        create_at: "2024-01-01".to_string(),
        name: "general".to_string(),
        server_id: "server-123".to_string(),
    });      
    repo.add_channel(Channel {
        channel_id: "channel-2".to_string(),
        create_at: "2024-01-02".to_string(),
        name: "random".to_string(),
        server_id: "server-123".to_string(),
    });

    repo.add_channel(Channel {
        channel_id: "channel-3".to_string(),
        create_at: "2024-01-03".to_string(),
        name: "other".to_string(),
        server_id: "server-456".to_string(),
    });

    let use_case = ListServerChannel { repo: &repo };
    let result = use_case.execute("server-123".to_string());

    assert!(result.is_ok());
    let channels = result.unwrap();
    assert_eq!(channels.len(), 2);
    assert!(channels.iter().all(|c| c.server_id == "server-123"));
}

#[test]
fn test_get_server_channels_empty() {
    let repo = MockChannelRepository::new();
    let use_case = ListServerChannel { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Entrez un id serveur valide");
}

#[test]
fn test_get_server_channels_zero() {
    let repo = MockChannelRepository::new();
    let use_case = ListServerChannel { repo: &repo };

    let result = use_case.execute("server-999".to_string());

    assert!(result.is_ok());
    let channels = result.unwrap();
    assert_eq!(channels.len(), 0);
}

#[test]
fn test_update_channel() {
    let repo = MockChannelRepository::new();
    let channel = Channel {
        channel_id: "channel-123".to_string(),
        create_at: "2024-01-01".to_string(),
        name: "general".to_string(),
        server_id: "server-123".to_string(),
    };
    repo.add_channel(channel);

    let use_case = UpdateChannel { repo: &repo };
    let result = use_case.execute(
        "channel-123".to_string(),
        "new-general".to_string(),
    );

    assert!(result.is_ok());
    let updated_channel = result.unwrap();
    assert_eq!(updated_channel.name, "new-general");
    assert_eq!(updated_channel.channel_id, "channel-123");
}

#[test]
fn test_update_channel_empty() {
    let repo = MockChannelRepository::new();
    let use_case = UpdateChannel { repo: &repo };

    let result = use_case.execute("".to_string(), "".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Besoin d'un id valide");
}

#[test]
fn test_update_channel_none() {
    let repo = MockChannelRepository::new();
    let use_case = UpdateChannel { repo: &repo };

    let result = use_case.execute(
        "non-existent".to_string(),
        "new-name".to_string(),
    );

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Channel not found");
}

#[test]
fn test_delete_channel() {
    let repo = MockChannelRepository::new();
    let channel = Channel {
        channel_id: "channel-123".to_string(),
        create_at: "2024-01-01".to_string(),
        name: "general".to_string(),
        server_id: "server-123".to_string(),
    };
    repo.add_channel(channel);

    let use_case = DeleteChannel { repo: &repo };
    let result = use_case.execute("channel-123".to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "channel-123");
    
    // Vérifier que le channel n'existe plus
    assert!(repo.find_by_id("channel-123".to_string()).is_err());
}

#[test]
fn test_delete_channel_empty() {
    let repo = MockChannelRepository::new();
    let use_case = DeleteChannel { repo: &repo };

    let result = use_case.execute("".to_string());

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Besoin d'un id valide");
}

#[test]
fn test_delete_channel_none() {
    let repo = MockChannelRepository::new();
    let use_case = DeleteChannel { repo: &repo };

    let result = use_case.execute("non-existent".to_string());

    assert!(result.is_err());
}
