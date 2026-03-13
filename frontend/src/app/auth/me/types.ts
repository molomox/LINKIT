export type UserProfile = {
    username: string;
    email: string;
    user_id: string;
    create_at: string;
};

export type Server = {
    id: string;
    name: string;
    memberCount: number;
};

export type ServerApiResponse = {
    server_id: string;
    name: string;
    password: string;
    create_at: string;
    all_channels: unknown[];
};

export type DmConversation = {
    channel_id: string;
    user_id: string;
    username: string;
    server_id: string;
    server_name: string;
};

export type DmRealtimeNotification = {
    id: string;
    channel_id: string;
    server_id: string;
    from_user_id: string;
    from_username: string;
    preview: string;
    is_gif: boolean;
};
