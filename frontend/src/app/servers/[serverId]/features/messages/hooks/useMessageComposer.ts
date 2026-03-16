import { useCallback, useRef, useState } from "react";
import type { WsMessage } from "@/hooks/useWebSocket";
import type { Channel } from "../../../types";
import { buildAuthHeaders } from "@/utils/authHeaders";

interface UseMessageComposerProps {
    selectedChannel: Channel | null;
    isConnected: boolean;
    sendWsMessage: (message: WsMessage) => void;
    serverId: string;
    apiBase: string;
    loadMessages: () => Promise<void>;
    networkErrorLabel: string;
}

export function useMessageComposer({
    selectedChannel,
    isConnected,
    sendWsMessage,
    serverId,
    apiBase,
    loadMessages,
    networkErrorLabel,
}: UseMessageComposerProps) {
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sendMessageViaRest = useCallback(
        async (content: string, isGif?: boolean) => {
            if (!selectedChannel) return;

            const userId = sessionStorage.getItem("user_id");
            const body: { content: string; user_id: string | null; is_gif?: boolean } = {
                content,
                user_id: userId,
            };

            if (isGif) {
                body.is_gif = true;
            }

            const res = await fetch(`${apiBase}/channels/${selectedChannel.channel_id}/messages`, {
                method: "POST",
                headers: buildAuthHeaders(),
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await loadMessages();
            }
        },
        [apiBase, selectedChannel, loadMessages],
    );

    const sendMessageViaWs = useCallback(
        (content: string, isGif?: boolean) => {
            if (!selectedChannel) return;

            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username") || "User";

            const wsMessage: WsMessage = {
                type: "new_message",
                content,
                user_id: userId || undefined,
                username,
                channel_id: selectedChannel.channel_id,
                server_id: serverId,
                ...(isGif ? { is_gif: true } : {}),
            };

            sendWsMessage(wsMessage);
        },
        [selectedChannel, serverId, sendWsMessage],
    );

    const handleSendMessage = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!newMessage.trim() || !selectedChannel || sending) return;

            setSending(true);
            try {
                if (isConnected) {
                    sendMessageViaWs(newMessage);
                    setNewMessage("");
                } else {
                    await sendMessageViaRest(newMessage);
                    setNewMessage("");
                }
            } catch (error) {
                console.error(networkErrorLabel, error);
            } finally {
                setSending(false);
            }
        },
        [
            newMessage,
            selectedChannel,
            sending,
            isConnected,
            sendMessageViaWs,
            sendMessageViaRest,
            networkErrorLabel,
        ],
    );

    const handleGifSelect = useCallback(
        async (gifUrl: string) => {
            if (!selectedChannel || sending) return;

            setSending(true);
            try {
                if (isConnected) {
                    sendMessageViaWs(gifUrl, true);
                } else {
                    await sendMessageViaRest(gifUrl, true);
                }
            } catch (error) {
                console.error(networkErrorLabel, error);
            } finally {
                setSending(false);
            }
        },
        [selectedChannel, sending, isConnected, sendMessageViaWs, sendMessageViaRest, networkErrorLabel],
    );

    const handleMessageChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setNewMessage(e.target.value);

            if (isConnected && selectedChannel) {
                const userId = sessionStorage.getItem("user_id");
                const username = sessionStorage.getItem("username") || "User";

                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                    sendWsMessage({
                        type: "typing",
                        user_id: userId || undefined,
                        username,
                        channel_id: selectedChannel.channel_id,
                    });
                }, 500);
            }
        },
        [isConnected, selectedChannel, sendWsMessage],
    );

    return {
        newMessage,
        sending,
        handleSendMessage,
        handleGifSelect,
        handleMessageChange,
    };
}
