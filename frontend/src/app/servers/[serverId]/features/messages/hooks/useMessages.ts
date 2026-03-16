import { useState, useCallback, useEffect } from "react";
import type { Message, ApiMessage, Channel } from "../../../types";
import { buildAuthHeaders } from "@/utils/authHeaders";

interface UseMessagesProps {
    selectedChannel: Channel | null;
    apiBase: string;
}

export function useMessages({ selectedChannel, apiBase }: UseMessagesProps) {
    const [messages, setMessages] = useState<Message[]>([]);

    const loadMessages = useCallback(async () => {
        if (!selectedChannel) {
            setMessages([]);
            return;
        }

        try {
            const messagesRes = await fetch(`${apiBase}/channels/${selectedChannel.channel_id}/messages`, {
                method: "GET",
                headers: buildAuthHeaders(),
            });

            if (messagesRes.ok) {
                const messagesData: ApiMessage[] = await messagesRes.json();

                const transformedMessages: Message[] = messagesData.map((msg) => ({
                    message_id: msg.message_id,
                    content: msg.content,
                    user_id: msg.user?.user_id || msg.user_id,
                    username: msg.user?.username || msg.username || "Utilisateur",
                    create_at: msg.create_at,
                    is_gif: (msg as ApiMessage & { IS_GIF?: boolean }).is_gif ??
                        (msg as ApiMessage & { IS_GIF?: boolean }).IS_GIF ??
                        false,
                    reactions: msg.reactions ?? [],
                }));

                setMessages(transformedMessages);
            }
        } catch (error) {
            console.error("Erreur chargement messages:", error);
        }
    }, [selectedChannel, apiBase]);

    useEffect(() => {
        if (!selectedChannel) {
            setMessages([]);
            return;
        }

        setMessages([]);
        loadMessages();
    }, [selectedChannel, loadMessages]);

    return {
        messages,
        setMessages,
        loadMessages,
    };
}
