use crate::domain::entities::channel::Channel;

pub trait ChannelRepository {
    fn save(&self, channel: Channel) -> Result<Channel, String>;
    fn update(&self, channel: Channel) -> Result<Channel, String>;
    fn find_by_id(&self, id: String) -> Result<Channel, String>;
    fn find_by_server(&self, server: String) -> Result<Vec<Channel>, String>;
    fn delete_channel(&self, channel_id: String) -> Result<String, String>;
}
