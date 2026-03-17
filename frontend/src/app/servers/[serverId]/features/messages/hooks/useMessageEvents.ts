import { useEffect, useRef } from "react";
import type { Message } from "../../../types";
import type { WsMessage } from "@/hooks/useWebSocket";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";


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
    const onMessagesUpdateRef = useRef(onMessagesUpdate);
    const onTypingUpdateRef = useRef(onTypingUpdate);
    const { notify } = useDesktopNotifications();

    useEffect(() => {
        onMessagesUpdateRef.current = onMessagesUpdate;
    }, [onMessagesUpdate]);

    useEffect(() => {
        onTypingUpdateRef.current = onTypingUpdate;
    }, [onTypingUpdate]);

    useEffect(() => {
        if (!lastMessage) return;

        console.log('📨 Message WebSocket reçu:', lastMessage);

        switch (lastMessage.type) {
            case 'new_message': {
                const ws = lastMessage as WsMessage & { IS_GIF?: boolean; isGif?: boolean };
                const newMsg: Message = {
                    message_id: lastMessage.message_id || '',
                    content: lastMessage.content || '',
                    user_id: lastMessage.user_id || '',
                    username: lastMessage.username || '',
                    create_at: lastMessage.create_at || new Date().toISOString(),
                    is_gif: ws.is_gif ?? ws.IS_GIF ?? ws.isGif ?? false,
                };

                const currentUserId = sessionStorage.getItem("user_id");
                if (lastMessage.user_id && lastMessage.user_id !== currentUserId){
                    notify({
                        title: `Nouveau message de ${lastMessage.username}`,
                        body: lastMessage.content,
                        tag: lastMessage.channel_id,
                    });
                }

                onMessagesUpdateRef.current(prevMessages => {
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
                    onTypingUpdateRef.current(lastMessage.username);
                }
                break;
            }

            case 'message_updated':
                onMessagesUpdateRef.current(prevMessages =>
                    prevMessages.map(msg =>
                        msg.message_id === lastMessage.message_id
                            ? { ...msg, content: lastMessage.content || msg.content }
                            : msg
                    )
                );
                break;

            case 'message_deleted':
                onMessagesUpdateRef.current(prevMessages =>
                    prevMessages.filter(msg => msg.message_id !== lastMessage.message_id)
                );
                break;

            case 'reaction_toggled':
                if (!lastMessage.reaction_id || !lastMessage.emoji) {
                    break;
                }
                onMessagesUpdateRef.current(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.message_id !== lastMessage.message_id) {
                            return msg;
                        }

                        const reactions = [...(msg.reactions ?? [])];
                        const reactionPayload = {
                            reaction_id: lastMessage.reaction_id || 0,
                            emoji: lastMessage.emoji || '',
                            reaction_name: lastMessage.reaction_name || '',
                        };

                        if (lastMessage.status === 'removed') {
                            const index = reactions.findIndex(r => r.reaction_id === reactionPayload.reaction_id);
                            if (index !== -1) {
                                reactions.splice(index, 1);
                            }
                        } else {
                            reactions.push(reactionPayload);
                        }

                        return {
                            ...msg,
                            reactions,
                        };
                    })
                );
                break;
        }
    }, [lastMessage]);
}
