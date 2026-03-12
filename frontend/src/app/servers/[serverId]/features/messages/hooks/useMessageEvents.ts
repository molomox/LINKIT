import { useEffect } from "react";
import type { Message } from "../types";
import type { WsMessage } from "@/hooks/useWebSocket";

interface UseMessageEventsProps {
    lastMessage: WsMessage | null;
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
    onTypingUpdate: (username: string) => void;
}

export function useMessageEvents({
    lastMessage,
    onMessagesUpdate,
    onTypingUpdate,
}: UseMessageEventsProps) {
    useEffect(() => {
        if (!lastMessage) return;

        console.log('📨 Message WebSocket reçu:', lastMessage);

        switch (lastMessage.type) {
            case 'new_message': {
                const newMsg: Message = {
                    message_id: lastMessage.message_id || '',
                    content: lastMessage.content || '',
                    user_id: lastMessage.user_id || '',
                    username: lastMessage.username || '',
                    create_at: lastMessage.create_at || new Date().toISOString(),
                };

                onMessagesUpdate(prevMessages => {
                    const exists = prevMessages.some(m => m.message_id === newMsg.message_id);
                    if (exists) return prevMessages;
                    return [...prevMessages, newMsg];
                });
                break;
            }

            case 'user_joined':
            case 'user_left':
                // Ces événements sont maintenant gérés par le ServerWebSocket
                break;

            case 'typing': {
                const currentUserId = sessionStorage.getItem("user_id");
                if (lastMessage.user_id && lastMessage.user_id !== currentUserId && lastMessage.username) {
                    onTypingUpdate(lastMessage.username);
                }
                break;
            }

            case 'message_updated':
                onMessagesUpdate(prevMessages =>
                    prevMessages.map(msg =>
                        msg.message_id === lastMessage.message_id
                            ? { ...msg, content: lastMessage.content || msg.content }
                            : msg
                    )
                );
                break;

            case 'message_deleted':
                onMessagesUpdate(prevMessages =>
                    prevMessages.filter(msg => msg.message_id !== lastMessage.message_id)
                );
                break;
        }
    }, [lastMessage, onMessagesUpdate, onTypingUpdate]);
}
