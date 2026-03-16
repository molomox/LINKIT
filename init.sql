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

CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
    server_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    create_at VARCHAR(255) NOT NULL,
    invite_code VARCHAR(36) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS channels (
    channel_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    server_id VARCHAR(36) NOT NULL,
    create_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    message_id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    channel_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    create_at VARCHAR(255) NOT NULL,
    IS_GIF BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS members (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    server_id VARCHAR(36) NOT NULL,
    join_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, server_id)
);

CREATE TABLE IF NOT EXISTS bans (
    ban_id VARCHAR(36) PRIMARY KEY,
    server_id VARCHAR(36) NOT NULL,
    bannished_user_id VARCHAR(36) NOT NULL,
    banned_by_user_id VARCHAR(36) NOT NULL,
    expired_at VARCHAR(255) NULL,
    reason TEXT NOT NULL,
    create_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(server_id),
    FOREIGN KEY (bannished_user_id) REFERENCES users(user_id),
    FOREIGN KEY (banned_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS reaction (
    reaction_id int PRIMARY KEY,
    emoji VARCHAR(36) NOT NULL,
    nom_reaction VARCHAR(36) NOT NULL
);

CREATE TABLE IF NOT EXISTS reagi (
    reaction_id int NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (reaction_id) REFERENCES reaction(reaction_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channel_dm (
    channel_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    user2_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO users (user_id, username, password, email, create_at) VALUES
('idnum01','dimitri','blabla','d@d.d','2023-01-01'),
('idnum02', 'Bastien', 'ag5y8iplo04rf3c','bastien@goat.ffr', '2023-01-01');

INSERT INTO roles (role_id, role_name) VALUES
('role01','ban'),
('role02','membre'),
('role03','Admin'),
('role04', 'Owner');

INSERT INTO servers (name, server_id, password, create_at, invite_code) VALUES
('Alice', 'ag5y8iplo04rf3c', 'alice_password', '2023-01-01', 'INVITE-ALICE-2023'),
('Bob', 'po90kE34scz1bnH87', 'bob_password', '2023-01-01', 'INVITE-BOB-2023');

INSERT INTO channels (channel_id, name, server_id, create_at) VALUES
('channel1', 'Alice', 'ag5y8iplo04rf3c', '2023-01-01'),
('channel2', 'Bob', 'po90kE34scz1bnH87', '2023-01-01');

INSERT INTO messages (message_id, content, channel_id, user_id, create_at, IS_GIF) VALUES
('message1', 'hello world', 'channel1','idnum01', '2023-01-01',false),
('message2', 'hello world 2', 'channel1','idnum01', '2023-01-01',false),
('message3', 'hello world 3', 'channel1','idnum01', '2023-01-01',false),
('message4', 'hello world 4', 'channel1','idnum01', '2023-01-01',false),
('message5', 'hello world 5', 'channel1','idnum01', '2023-01-01',false),
('message6', 'hello world 6', 'channel1','idnum01', '2023-01-01',false),
('message7', 'hello world 7', 'channel1','idnum01', '2023-01-01',false),
('message8', 'hello world 8', 'channel1','idnum01', '2023-01-01',false),
('message9', 'hello world 9', 'channel1','idnum01', '2023-01-01',false),
('message10', 'hello world 10', 'channeldm4','idnum01', '2023-01-01',false);

INSERT INTO members (user_id, server_id, role_id,join_at) VALUES
('idnum01', 'po90kE34scz1bnH87', 'role04', '2023-01-01'),
('idnum01', 'ag5y8iplo04rf3c', 'role02', '2023-01-01');

INSERT INTO channel_dm (channel_id,user_id,user2_id) VALUES
('channeldm4', 'idnum01', 'idnum02');

INSERT INTO messages (message_id, content, channel_id, user_id, create_at, IS_GIF) VALUES
('message11', 'hello world 10', 'channeldm4','idnum01', '2023-01-01',false);

INSERT INTO reaction (reaction_id, emoji, nom_reaction) VALUES
(1, '👍', 'like'),
(2, '👎', 'dislike'),
(3, '❤️', 'heart'),
(4, '🔥', 'fire'),
(5, '😢', 'sad'),
(6, '😠', 'angry'),
(7, '😭', 'crying'),
(8, '🤯', 'shocked'),
(9, '😝', 'happy'),
(10, '😜', 'tongue'),
(11, '😂', 'laughing'),
(12, '😎', 'cool'),
(13, '🤔', 'thinking'),
(14, '🙌', 'celebration'),
(15, '👏', 'clapping'),
(16, '💔', 'broken_heart'),
(17, '😇', 'innocent'),
(18, '🤗', 'hugging'),
(19, '😴', 'sleepy'),
(20, '🤤', 'drooling'),
(21, '😈', 'devil'),
(22, '👻', 'ghost'),
(23, '💩', 'poop'),
(24, '👽', 'alien'),
(25, '🤖', 'robot'),
(26, '🎉', 'party'),
(27, '🎂', 'birthday'),
(28, '🎁', 'gift'),
(29, '🎈', 'balloon'),
(30, '🎊', 'confetti');

INSERT INTO reagi (reaction_id,user_id,message_id) VALUES
('1', 'idnum01', 'message1'),
('2', 'idnum01', 'message1'),
('3', 'idnum01', 'message1'),
('4', 'idnum01', 'message1'),
('5', 'idnum01', 'message1'),
('6', 'idnum01', 'message1'),
('7', 'idnum01', 'message1'),
('8', 'idnum01', 'message1'),
('9', 'idnum01', 'message1'),
('10', 'idnum01', 'message1');

-- Vue pour récupérer les messages avec les informations des utilisateurs (PostgreSQL)
CREATE OR REPLACE VIEW view_messages AS

SELECT
    m.message_id,
    m.content,
    m.channel_id,
    m.user_id,
    m.create_at,
    u.username,
    u.email,
    re.user_id AS reaction_user_id,
    r.reaction_id,
    r.emoji,
    m.IS_GIF,
	ur.username AS reaction_username
FROM messages      AS m
JOIN channels      AS c  ON m.channel_id  = c.channel_id
JOIN users         AS u  ON m.user_id     = u.user_id
LEFT JOIN reagi    AS re ON m.message_id  = re.message_id
LEFT JOIN reaction AS r  ON re.reaction_id = r.reaction_id
LEFT JOIN users    AS ur ON  re.user_id = ur.user_id;



-- Index composite avec INCLUDE pour optimiser complètement la requête (covering index)
CREATE INDEX IF NOT EXISTS idx_messages_channel_create ON messages(channel_id, create_at)
INCLUDE (message_id, content, user_id);

