use serde::{Deserialize, Serialize};

/// Messages ENTRANTS du frontend (sans message_id car pas encore créé)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum IncomingWsMessage {
    #[serde(rename = "new_message")]
    NewMessage {
        content: String,
        user_id: String,
        username: String,
        channel_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        server_id: Option<String>,
    },
    #[serde(rename = "typing")]
    Typing {
        user_id: String,
        username: String,
        channel_id: String,
    },
    #[serde(rename = "identify")]
    Identify {
        user_id: String,
        username: String,
    },
    #[serde(rename = "ping")]
    Ping,
}

/// Messages SORTANTS vers le frontend (avec message_id généré)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "new_message")]
    NewMessage {
        message_id: String,
        content: String,
        user_id: String,
        username: String,
        channel_id: String,
        create_at: String,
    },
    #[serde(rename = "message_updated")]
    MessageUpdated {
        message_id: String,
        content: String,
        user_id: String,
        username: String,
        channel_id: String,
    },
    #[serde(rename = "message_deleted")]
    MessageDeleted {
        message_id: String,
        channel_id: String,
    },
    #[serde(rename = "user_joined")]
    UserJoined {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "user_left")]
    UserLeft {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "typing")]
    Typing {
        user_id: String,
        username: String,
        channel_id: String,
    },
    #[serde(rename = "channel_created")]
    ChannelCreated {
        channel_id: String,
        name: String,
        server_id: String,
        create_at: String,
    },
    #[serde(rename = "channel_updated")]
    ChannelUpdated {
        channel_id: String,
        name: String,
        server_id: String,
    },
    #[serde(rename = "channel_deleted")]
    ChannelDeleted {
        channel_id: String,
        server_id: String,
    },
    #[serde(rename = "member_joined")]
    MemberJoined {
        user_id: String,
        username: String,
        server_id: String,
        role_id: String,
        role_name: String,
    },
    #[serde(rename = "member_role_changed")]
    MemberRoleChanged {
        user_id: String,
        username: String,
        server_id: String,
        role_id: String,
        role_name: String,
    },
    #[serde(rename = "member_kicked")]
    MemberKicked {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "member_banned")]
    MemberBanned{
        user_id: String,
        username: String,
        server_id: String,
        reason: String,
    },
    #[serde(rename = "user_online")]
    UserOnline {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "user_offline")]
    UserOffline {
        user_id: String,
        username: String,
        server_id: String,
    },
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,
}
