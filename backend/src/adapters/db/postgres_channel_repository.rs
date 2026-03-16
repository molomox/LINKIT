use crate::adapters::http::constants::db_url;
use crate::domain::entities::channel::Channel;
use crate::domain::ports::channel_repository::ChannelRepository;
use postgres::{Client, NoTls};

pub struct PostgresChannelRepo;
impl ChannelRepository for PostgresChannelRepo {
    fn save(&self, channel: Channel) -> Result<Channel, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO channels (channel_id,name,server_id,create_at) VALUES ($1, $2, $3, $4)",
            &[ &channel.channel_id,&channel.name, &channel.server_id, &channel.create_at]
        ).map_err(|e| e.to_string())?;
        Ok(channel)
    }

    fn find_by_id(&self, id: String) -> Result<Channel, String> {
        let mut client = Client::connect(&db_url(), NoTls)
            .map_err(|e| e.to_string())
            .unwrap();
        let row = client
            .query_one(
                "SELECT channel_id,name,server_id,create_at FROM channels WHERE channel_id = $1",
                &[&id],
            )
            .map_err(|e| e.to_string())?;

        let channel_id: String = row.get(0);
        let name: String = row.get(1);
        let server_id: String = row.get(2);
        let create_at: String = row.get(3);
        let channel = Channel {
            channel_id,
            name,
            server_id,
            create_at,
        };
        Ok(channel)
    }

    fn find_by_server(&self, server: String) -> Result<Vec<Channel>, String> {
        let mut client = Client::connect(&db_url(), NoTls)
            .map_err(|e| e.to_string())
            .unwrap();
        let mut channels_response = Vec::new();
        for row in client
            .query(
                "SELECT channel_id,name,server_id,create_at FROM channels WHERE server_id = $1",
                &[&server],
            )
            .map_err(|e| e.to_string())?
        {
            let channel_id: String = row.get(0);
            let name: String = row.get(1);
            let server_id: String = row.get(2);
            let create_at: String = row.get(3);
            let channel = Channel {
                channel_id,
                name,
                server_id,
                create_at,
            };
            channels_response.push(channel);
        }
        Ok(channels_response)
    }
    fn delete_channel(&self, channel_id: String) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls)
            .map_err(|e| e.to_string())
            .unwrap();
        client
            .execute("DELETE FROM channels WHERE channel_id = $1", &[&channel_id])
            .unwrap();
        Ok(channel_id)
    }

    fn update(&self, channel: Channel) -> Result<Channel, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client
            .execute(
                "UPDATE channels SET name = $2 WHERE channel_id = $1",
                &[&channel.channel_id, &channel.name],
            )
            .map_err(|e| e.to_string())?;
        Ok(channel)
    }
}
