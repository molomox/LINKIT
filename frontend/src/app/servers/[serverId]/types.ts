export type Message = {
    message_id: string;
    content: string;
    user_id: string;
    username: string;
    create_at: string;
    is_gif?: boolean;
};

export type ApiMessage = {
    message_id: string;
    content: string;
    channel_id: string;
    user?: {
        user_id: string;
        username: string;
        email: string;
    };
    user_id: string;
    username?: string;
    create_at: string;
    is_gif?: boolean;
};

export type Member = {
    user_id: string;
    username: string;
    role_name: string;
    join_at: string;
    role_id: string;
};

export type ApiMember = {
    user?: {
        user_id: string;
        username: string;
        email: string;
    };
    role?: {
        role_id: string;
        role_name: string;
        permissions?: string[];
    };
    user_id?: string;
    username?: string;
    role_name?: string;
    join_at?: string;
    role_id?: string;
};

export type Server = {
    server_id: string;
    name: string;
    create_at: string;
    invite_code: string;
};

export type Channel = {
    channel_id: string;
    name: string;
    server_id: string;
    create_at: string;
};
