use postgres::Client;
use postgres::NoTls;
use crate::adapters::http::server;
use crate::domain::entities::member;
use crate::domain::entities::member::Member;
use crate::domain::entities::role::{self, Role};
use crate::domain::entities::server::Server;
use crate::domain::entities::user::User;
use crate::domain::ports::member_repository::MemberRepository;
use crate::adapters::http::constants::DB_URL;

pub struct PostgresMemberRepo;
impl MemberRepository for PostgresMemberRepo{
    fn save(&self, member: Member)-> Result<Member, String>{
         let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "INSERT INTO members (user_id,role_id,server_id, join_at) VALUES ($1, $2, $3, $4)",
            &[&member.user.user_id, &member.role.role_id, &member.server.server_id, &member.join_at]
        ).map_err(|e| e.to_string())?;
        Ok(member)
    }

    fn find_by_id(&self, id: String) -> Result<Member, String>{
         let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;

        let row = client.query_one(
            "SELECT members.user_id,
                members.role_id,
                role_name,
                server_id,
                servers.name, 
                servers.create_at,
                join_at 
                FROM members
                JOIN roles ON members.role_id = roles.role_id
                JOIN servers ON members.server_id = servers.server_id WHERE members.user_id = $1",
            &[&id]
        ).map_err(|e| e.to_string())?;
        let user = User{user_id : row.get(0),
            username:"".to_string(),
            password:"".to_string(),
            email:"".to_string(),
            create_at:"".to_string(),
            token: None};
        let role = Role{role_id:row.get(1),role_name:row.get(2)};
        let server = Server{server_id:row.get(3),
            name:row.get(4),
            password:"".to_string(),
            create_at:row.get(5),
            invite_code:"".to_string(),
            all_channels:vec![]};
        let member = Member { user, server, role, join_at:row.get(6) };
        Ok(member)

    }

    fn update_member_role(&self, user_id: String, server_id: String, role_id: String)-> Result<String, String>{
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;

        client.execute(
            "
            UPDATE members 
            SET role_id = $3 
            WHERE user_id = $1 
            AND server_id = $2;",
            &[&user_id,&server_id,&role_id]
        ).map_err(|e| e.to_string())?;
        
        Ok(role_id)

    }
    fn delete_member(&self, user_id: String, server_id: String)-> Result<String,String>{
        let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string()).unwrap();
        client.execute("DELETE FROM members WHERE user_id = $1 AND server_id = $2", &[&user_id,&server_id]).unwrap();
        Ok(server_id)

    }
    fn find_by_server_id(&self, server_id: String)-> Result<Vec<Member>,String>{
         let mut client = Client::connect(DB_URL, NoTls).map_err(|e| e.to_string())?;
        let mut result_members = Vec::new();
        for row in client.query(
            "SELECT members.user_id,
                members.role_id,
                role_name,
                members.server_id,
                join_at,
                users.username
                FROM members
                JOIN roles ON members.role_id = roles.role_id
                JOIN servers ON members.server_id = servers.server_id 
                JOIN users ON members.user_id = users.user_id 
                WHERE members.server_id = $1",
            &[&server_id]
        ).map_err(|e| e.to_string())?{
            let user = User{user_id : row.get(0),
                username:row.get(5) ,
                password:"".to_string(),
                email:"".to_string(),
                create_at:"".to_string(),
                token: None};
            let role = Role{role_id:row.get(1),role_name:row.get(2)};
            let server = Server{server_id:row.get(3),
                name:"".to_string(),
                password:"".to_string(),
                create_at:"".to_string(),
                invite_code:"".to_string(),
                all_channels:vec![]};
            let member = Member { user, server, role, join_at:row.get(4) };
            result_members.push(member)
        }
        Ok(result_members)

    }
}