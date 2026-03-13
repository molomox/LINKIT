use crate::adapters::http::constants::db_url;
use crate::domain::entities::channel::Channel;
use crate::domain::entities::server::Server;
use crate::domain::ports::server_repository::ServerRepository;
use postgres::{Client, NoTls};

pub struct PostgresServerRepo;

impl ServerRepository for PostgresServerRepo {
    fn save(&self, server: Server) -> Result<Server, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO servers (name, server_id, password, create_at, invite_code) VALUES ($1, $2, $3, $4, $5)",
            &[&server.name, &server.server_id, &server.password, &server.create_at, &server.invite_code]
        ).map_err(|e| e.to_string())?;

        Ok(server)
    }

    fn find_by_id(&self, server_id: String) -> Result<Server, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let row = client
            .query_one(
                "SELECT name, server_id, password, create_at, invite_code FROM servers WHERE server_id = $1",
                &[&server_id]
            ).map_err(|e| e.to_string())?;

        let server_name: String = row.get(0);
        let server: String = row.get(1);
        let password: String = row.get(2);
        let create_at: String = row.get(3);
        let invite_code: String = row.get(4);

        let mut server_response = Server {
            server_id: server,
            name: server_name,
            password,
            create_at,
            invite_code,
            all_channels: Vec::new(),
        };

        for row in client
            .query(
                "SELECT channel_id, name, server_id, create_at FROM channels WHERE server_id = $1",
                &[&server_id],
            )
            .map_err(|e| e.to_string())?
        {
            let channel = Channel {
                channel_id: row.get(0),
                name: row.get(1),
                server_id: row.get(2),
                create_at: row.get(3),
            };
            server_response.all_channels.push(channel);
        }

        Ok(server_response)
    }

    fn find_by_user_id(&self, user_id: String) -> Result<Vec<Server>, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let mut server_response = Vec::new();

        for row in client.query(
            "SELECT name, servers.server_id, password, create_at, invite_code FROM members JOIN servers ON members.server_id = servers.server_id WHERE user_id = $1",
            &[&user_id]
        ).map_err(|e| e.to_string())? {
            let server_name: String = row.get(0);
            let server_id: String = row.get(1);
            let password: String = row.get(2);
            let create_at: String = row.get(3);
            let invite_code: String = row.get(4);

            let mut one_server = Server {
                server_id: server_id.clone(),
                name: server_name,
                password,
                create_at,
                invite_code,
                all_channels: Vec::new(),
            };

            for channel_row in client.query(
                "SELECT channel_id, name, server_id, create_at FROM channels WHERE server_id = $1",
                &[&server_id]
            ).map_err(|e| e.to_string())? {
                let channel = Channel {
                    channel_id: channel_row.get(0),
                    name: channel_row.get(1),
                    server_id: channel_row.get(2),
                    create_at: channel_row.get(3)
                };
                one_server.all_channels.push(channel);
            }

            server_response.push(one_server);
        }

        Ok(server_response)
    }

    fn delete_server(&self, server_id: String) -> Result<String, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        client
            .execute("DELETE FROM servers WHERE server_id = $1", &[&server_id])
            .map_err(|e| e.to_string())?;

        Ok(server_id)
    }

    fn find_by_invite_code(&self, invite_code: String) -> Result<Server, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;
        let row = client
            .query_one(
                "SELECT name, server_id, password, create_at, invite_code FROM servers WHERE invite_code = $1",
                &[&invite_code]
            ).map_err(|e| e.to_string())?;

        let server_name: String = row.get(0);
        let server_id: String = row.get(1);
        let password: String = row.get(2);
        let create_at: String = row.get(3);
        let invite_code: String = row.get(4);

        let mut server_response = Server {
            server_id: server_id.clone(),
            name: server_name,
            password,
            create_at,
            invite_code,
            all_channels: Vec::new(),
        };

        for row in client
            .query(
                "SELECT channel_id, name, server_id, create_at FROM channels WHERE server_id = $1",
                &[&server_id],
            )
            .map_err(|e| e.to_string())?
        {
            let channel = Channel {
                channel_id: row.get(0),
                name: row.get(1),
                server_id: row.get(2),
                create_at: row.get(3),
            };
            server_response.all_channels.push(channel);
        }

        Ok(server_response)
    }

    fn update(&self, server: Server) -> Result<Server, String> {
        let mut client = Client::connect(&db_url(), NoTls).map_err(|e| e.to_string())?;

        client
            .execute(
                "UPDATE servers SET name = $2 WHERE server_id = $1",
                &[&server.server_id, &server.name],
            )
            .map_err(|e| e.to_string())?;
        Ok(server)
    }
}
