"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useWebSocket, type WsMessage } from "@/hooks/useWebSocket";
import GifPicker from "@/components/GifPicker";
import RequireAuth from "@/components/RequireAuth";
import { buildAuthHeaders } from "@/utils/authHeaders";

type DmMessage = {
    message_id: string;
    content: string;
    user_id: string;
    username: string;
    create_at: string;
    is_gif?: boolean;
};

type ApiDmMessage = {
    message_id: string;
    content: string;
    channel_id: string;
    user?: {
        user_id: string;
        username: string;
    };
    user_id: string;
    username?: string;
    create_at: string;
    is_gif?: boolean;
};

export default function DirectMessagePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { t } = useTranslation();

    const channelId = params.channelId as string;
    const targetUsername = searchParams.get("username") || "Unknown";

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://linkyt-backend-fqz7hu-60dfe2-46-224-236-78.traefik.me/";
    const [messages, setMessages] = useState<DmMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { status, lastMessage, sendMessage, isConnected } = useWebSocket(channelId);

    const currentUser = useMemo(() => {
        if (typeof window === "undefined") {
            return { userId: null as string | null, username: null as string | null };
        }
        return {
            userId: sessionStorage.getItem("user_id"),
            username: sessionStorage.getItem("username") || "User",
        };
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetch(`${apiBase}/channels/${channelId}/messages`, {
                    method: "GET",
                    headers: buildAuthHeaders(),
                });

                if (!res.ok) return;

                const data: ApiDmMessage[] = await res.json();
                setMessages(
                    data.map((m) => ({
                        message_id: m.message_id,
                        content: m.content,
                        user_id: m.user?.user_id || m.user_id,
                        username: m.user?.username || m.username || "User",
                        create_at: m.create_at,
                        is_gif: m.is_gif ?? false,
                    })),
                );
            } catch (error) {
                console.error("Erreur chargement historique DM:", error);
            }
        };

        if (channelId) {
            loadHistory();
        }
    }, [apiBase, channelId]);

    useEffect(() => {
        if (!lastMessage || lastMessage.type !== "new_message") return;

        const incoming: DmMessage = {
            message_id: lastMessage.message_id || "",
            content: lastMessage.content || "",
            user_id: lastMessage.user_id || "",
            username: lastMessage.username || "",
            create_at: lastMessage.create_at || new Date().toISOString(),
            is_gif: lastMessage.is_gif ?? false,
        };

        setMessages((prev) => {
            if (prev.some((m) => m.message_id === incoming.message_id)) {
                return prev;
            }
            return [...prev, incoming];
        });
    }, [lastMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendViaRest = async (content: string, isGif?: boolean) => {
        if (!currentUser.userId) return;

        await fetch(`${apiBase}/channels/${channelId}/messages`, {
            method: "POST",
            headers: buildAuthHeaders(),
            body: JSON.stringify({ content, user_id: currentUser.userId, ...(isGif ? { is_gif: true } : {}) }),
        });
    };

    const sendDmMessage = async (content: string, isGif?: boolean) => {
        if (!content.trim() || sending || !currentUser.userId) return;

        setSending(true);
        try {
            if (isConnected) {
                const message: WsMessage = {
                    type: "new_message",
                    content,
                    user_id: currentUser.userId,
                    username: currentUser.username || "User",
                    channel_id: channelId,
                    ...(isGif ? { is_gif: true } : {}),
                };
                sendMessage(message);
            } else {
                await sendViaRest(content, isGif);
            }

            if (!isGif) {
                setNewMessage("");
            }
        } catch (error) {
            console.error(t.error.network, error);
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendDmMessage(newMessage);
    };

    const handleGifSelect = async (gifUrl: string) => {
        await sendDmMessage(gifUrl, true);
        setShowGifPicker(false);
    };

    return (
        <RequireAuth>
        <div className="h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
            <header className="border-b-2 border-yellow-400/30 bg-black/80 px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="px-3 py-1 border-2 border-yellow-400/50 text-yellow-300 text-xs hover:bg-yellow-400 hover:text-black transition-all"
                        style={{ fontFamily: "monospace" }}
                    >
                        Retour
                    </button>
                    <button
                        onClick={() => router.push("/auth/me")}
                        className="px-3 py-1 border border-gray-600 text-gray-300 text-xs hover:border-yellow-400 hover:text-yellow-300 transition-all"
                        style={{ fontFamily: "monospace" }}
                    >
                        Dashboard
                    </button>
                </div>
                <div className="text-yellow-400 font-bold uppercase text-sm" style={{ fontFamily: "monospace" }}>
                    DM with @{targetUsername}
                </div>
                <div className="text-xs text-gray-500" style={{ fontFamily: "monospace" }}>
                    Channel: {channelId} | WS: {status}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                    <div key={m.message_id} className="p-3 border border-yellow-400/20 bg-black/50">
                        <div className="text-xs text-yellow-400 mb-1" style={{ fontFamily: "monospace" }}>
                            {m.username}
                        </div>
                        {m.is_gif ? (
                            <img src={m.content} alt="GIF" className="max-w-md max-h-72 rounded border border-yellow-400/30" />
                        ) : (
                            <p className="text-gray-200 text-sm" style={{ fontFamily: "monospace" }}>{m.content}</p>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            <form onSubmit={handleSubmit} className="border-t-2 border-yellow-400/30 p-4 bg-black/70 flex gap-2">
                <button
                    type="button"
                    onClick={() => setShowGifPicker(true)}
                    disabled={sending}
                    className="px-3 py-2 border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50"
                    style={{ fontFamily: "monospace" }}
                    title="Envoyer un GIF"
                >
                    GIF
                </button>
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-black/60 border border-yellow-400/30 px-3 py-2 text-gray-200"
                    style={{ fontFamily: "monospace" }}
                    placeholder="Type your private message..."
                />
                <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all disabled:opacity-50"
                    style={{ fontFamily: "monospace" }}
                >
                    Send
                </button>
            </form>

            {showGifPicker && (
                <GifPicker
                    onGifSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}
        </div>
        </RequireAuth>
    );
}
