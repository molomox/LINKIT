-- CREATE DATABASE mydb;
-- CREATE USER postgres WITH PASSWORD 'postgres';
-- GRANT ALL PRIVILEGES ON DATABASE mydb TO postgres;
    
-- \connect mydb;

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    create_at VARCHAR(255) NOT NULL,
    token TEXT
);

CREATE TABLE IF NOT EXISTS channels (
    channel_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    server_id VARCHAR(36) NOT NULL,
    create_at VARCHAR(255) NOT NULL 
);

CREATE TABLE IF NOT EXISTS messages (
    message_id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    channel_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    create_at VARCHAR(255) NOT NULL 
);

CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    server_id VARCHAR(36) NOT NULL,
    join_at VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, server_id)
);

CREATE TABLE IF NOT EXISTS servers (
    name VARCHAR(255) NOT NULL,
    server_id VARCHAR(36) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    create_at VARCHAR(255) NOT NULL,
    invite_code VARCHAR(36) NOT NULL UNIQUE
);

INSERT INTO servers (name, server_id, password, create_at, invite_code) VALUES
('Alice', 'ag5y8iplo04rf3c', 'alice_password', '2023-01-01', 'INVITE-ALICE-2023'),
('Bob', 'po90kE34scz1bnH87', 'bob_password', '2023-01-01', 'INVITE-BOB-2023');

INSERT INTO channels (channel_id, name, server_id, create_at) VALUES
('channel1', 'Alice', 'ag5y8iplo04rf3c', '2023-01-01'),
('channel2', 'Bob', 'po90kE34scz1bnH87', '2023-01-01');

INSERT INTO users (user_id, username, password, email, create_at) VALUES
('idnum01','dimitri','blabla','d@d.d','2023-01-01'),
('idnum02', 'Bastien', 'ag5y8iplo04rf3c','bastien@goat.ffr', '2023-01-01');

INSERT INTO roles (role_id, role_name) VALUES
('role01','ban'),
('role02','membre'),
('role03','Admin'),
('role04', 'Owner');

INSERT INTO members (user_id, server_id, role_id,join_at) VALUES
('idnum01', 'po90kE34scz1bnH87', 'role04', '2023-01-01'),
('idnum01', 'ag5y8iplo04rf3c', 'role02', '2023-01-01');

INSERT INTO messages (message_id, content, channel_id, user_id, create_at) VALUES
('message1', 'hello world', 'channel1','idnum01', '2023-01-01'),
('message2', 'hello world 2', 'channel1','idnum01', '2023-01-01');

-- Vue pour récupérer les messages avec les informations des utilisateurs (PostgreSQL)
CREATE OR REPLACE VIEW view_messages AS
SELECT
    m.message_id,
    m.content,
    m.channel_id,
    m.user_id,
    m.create_at,
    u.username,
    u.email
FROM messages AS m
JOIN users AS u ON m.user_id = u.user_id;

-- Index composite avec INCLUDE pour optimiser complètement la requête (covering index)
CREATE INDEX IF NOT EXISTS idx_messages_channel_create ON messages(channel_id, create_at)
INCLUDE (message_id, content, user_id);

