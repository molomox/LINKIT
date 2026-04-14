"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import RequireAuth from "@/components/RequireAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import type { Message, Member, Channel } from "./types";
import MessageItem from "./features/messages/components/MessageItem";
import TypingIndicator from "./features/messages/components/TypingIndicator";
import MessageInput from "./features/messages/components/MessageInput";
import ChannelList from "./components/ChannelList";
import MemberList from "./features/members/components/MemberList";
import ServerModals from "./features/server/components/ServerModals";
import ServerHeader from "./features/server/components/ServerHeader";
import { useServerData } from "./features/server/hooks/useServerData";
import { useMembers } from "./features/members/hooks/useMembers";
import { useMessages } from "./features/messages/hooks/useMessages";
import { useBanCleanup } from "./features/members/hooks/useBanCleanup";
import { useBanCheck } from "./features/members/hooks/useBanCheck";
import { useServerEvents } from "./features/server/hooks/useServerEvents";
import { useMessageEvents } from "./features/messages/hooks/useMessageEvents";
import { useMessageReactions } from "./features/messages/hooks/useMessageReactions";
import { useMessageComposer } from "./features/messages/hooks/useMessageComposer";
import * as serverActions from "./utils/serverActions";
import * as messageActions from "./utils/messageActions";
import { buildAuthHeaders } from "@/utils/authHeaders";

type DmHeaderNotification = {
    id: string;
    channel_id: string;
    server_id: string;
    from_user_id: string;
    from_username: string;
    preview: string;
    is_gif: boolean;
};

export default function ServerPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const serverId = params.serverId as string;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://linkyt-backend-fqz7hu-60dfe2-46-224-236-78.traefik.me/";

    // Custom hooks
    const { server, channels, selectedChannel, loading, setChannels, setSelectedChannel } = useServerData({
        serverId,
        apiBase,
    });

    const { members, onlineMembers, loadMembers, setOnlineMembers } = useMembers({ serverId, apiBase });
    const { messages, setMessages, loadMessages } = useMessages({ selectedChannel, apiBase });

    // State
    const [copied, setCopied] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [dmNotifications, setDmNotifications] = useState<DmHeaderNotification[]>([]);
    const [unreadDmCount, setUnreadDmCount] = useState(0);
    const [isDmNotifOpen, setIsDmNotifOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dmNotifOpenRef = useRef(false);

    // WebSocket hooks
    const { status: wsStatus, lastMessage, sendMessage: sendWsMessage, isConnected } = useWebSocket(
        selectedChannel?.channel_id || null
    );
    const { lastMessage: lastServerMessage } = useServerWebSocket(serverId);

    // Custom hooks for side effects
    useBanCleanup({ serverId, apiBase, onMembersUpdate: loadMembers });
    useBanCheck({ members, onBanned: () => router.push('/auth/me') });

    useServerEvents({
        lastServerMessage,
        selectedChannel,
        onChannelsUpdate: setChannels,
        onSelectedChannelUpdate: setSelectedChannel,
        onMembersReload: loadMembers,
        onRedirect: (path) => router.push(path),
        onOnlineMembersUpdate: setOnlineMembers,
    });

    useMessageEvents({
        lastMessage,
        onMessagesUpdate: setMessages,
        onTypingUpdate: (username) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(username);
                return newSet;
            });
            setTimeout(() => {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(username);
                    return newSet;
                });
            }, 3000);
        },
    });

    const { availableReactions, handleToggleReaction } = useMessageReactions({
        apiBase,
        onMessagesUpdate: setMessages,
        onError: (error) => {
            alert(`${t.error.generic}: ${error}`);
        },
    });

    const {
        newMessage,
        sending,
        handleSendMessage,
        handleGifSelect,
        handleMessageChange,
    } = useMessageComposer({
        selectedChannel,
        isConnected,
        sendWsMessage,
        serverId,
        apiBase,
        loadMessages,
        networkErrorLabel: t.error.network,
    });

    const sessionUserId = typeof window !== "undefined" ? sessionStorage.getItem("user_id") : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        dmNotifOpenRef.current = isDmNotifOpen;
    }, [isDmNotifOpen]);

    useEffect(() => {
        const onDmNotification = (event: Event) => {
            const detail = (event as CustomEvent<{
                channel_id?: string;
                server_id?: string;
                from_user_id?: string;
                from_username?: string;
                preview?: string;
                is_gif?: boolean;
            }>).detail;

            if (!detail?.channel_id) {
                return;
            }

            const notif: DmHeaderNotification = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                channel_id: detail.channel_id,
                server_id: detail.server_id || serverId,
                from_user_id: detail.from_user_id || "",
                from_username: detail.from_username || "Utilisateur",
                preview: detail.is_gif ? "a envoye un GIF" : (detail.preview || "Nouveau message"),
                is_gif: !!detail.is_gif,
            };

            setDmNotifications((prev) => [notif, ...prev].slice(0, 10));
            if (!dmNotifOpenRef.current) {
                setUnreadDmCount((prev) => prev + 1);
            }
        };

        window.addEventListener("linkyt:dm-notification", onDmNotification as EventListener);
        return () => {
            window.removeEventListener("linkyt:dm-notification", onDmNotification as EventListener);
        };
    }, [serverId]);

    // Gérer la connexion WebSocket
    useEffect(() => {
        if (isConnected && selectedChannel) {
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username");

            if (userId && username) {
                setOnlineMembers(prev => new Set(prev).add(userId));

                sendWsMessage({
                    type: 'new_message',
                    content: '',
                    user_id: userId,
                    username: username,
                    channel_id: selectedChannel.channel_id,
                    server_id: serverId as string,
                });
            }
        }
    }, [isConnected, selectedChannel, sendWsMessage, serverId, setOnlineMembers]);

    const currentUserRole = useMemo((): { role_id: string | null } => {
        if (!sessionUserId) return { role_id: null };
        const member = members.find((m) => m.user_id === sessionUserId);
        return {
            role_id: member?.role_id || null,
        };
    }, [members, sessionUserId]);
    const isOwner = currentUserRole.role_id === "role04";
    const canLeave = ["role02", "role03"].includes(currentUserRole.role_id || "");

    // Server action handlers
    const handleCopyInvite = async () => {
        try {
            if (!server?.invite_code) return;
            await serverActions.copyInviteLink(server.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error(t.error.generic, error);
        }
    };

    const handleLeaveServer = async () => {
        setActionLoading(true);
        try {
            await serverActions.leaveServer(serverId, apiBase);
            router.push("/auth/me");
        } catch (error) {
            alert(`Erreur: ${error}`);
        } finally {
            setActionLoading(false);
            setShowLeaveModal(false);
        }
    };

    const handleDeleteServer = async () => {
        if (deleteConfirmName !== server?.name) {
            alert(t.server.deleteNameMismatch);
            return;
        }
        setActionLoading(true);
        try {
            await serverActions.deleteServer(serverId, apiBase);
            router.push("/auth/me");
        } catch (error) {
            alert(`${t.error.generic}: ${error}`);
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
            setDeleteConfirmName("");
        }
    };

    // Message action handlers
    const handleDeleteMessage = async (messageId: string) => {
        try {
            await messageActions.deleteMessage(messageId, apiBase);
            setMessages((prev) => prev.filter(m => m.message_id !== messageId));
        } catch (error) {
            alert(`${t.error.generic}: ${error}`);
        }
    };

    const handleUpdateMessage = async (messageId: string, newContent: string) => {
        try {
            await messageActions.updateMessage(messageId, newContent, apiBase);
            setMessages((prev) =>
                prev.map((m) =>
                    m.message_id === messageId ? { ...m, content: newContent } : m
                )
            );
        } catch (error) {
            alert(`${t.error.generic}: ${error}`);
        }
    };

    // Channel action handlers
    const handleDeleteChannel = async (channelId: string, channelName: string) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert(t.error.unauthorized);
                return;
            }

            const res = await fetch(`${apiBase}/channels/${channelId}`, {
                method: 'DELETE',
                headers: buildAuthHeaders(false),
            });

            if (!res.ok) {
                const errText = await res.text();
                alert(`${t.error.deleteFailed}: ${errText}`);
                return;
            }

            console.log(`✅ Channel #${channelName} supprimé avec succès`);
            // Le WebSocket mettra à jour automatiquement la liste des channels via useServerEvents
        } catch (error) {
            console.error(t.error.generic, error);
            alert(t.error.deleteFailed.replace('{message}', 'channel'));
        }
    };

    const handleStartPrivateMessage = async (member: Member) => {
        try {
            const dm = await serverActions.createOrGetDmChannel(serverId, member.user_id, apiBase);
            const dmUrl = `/dm/${dm.channel_id}?serverId=${encodeURIComponent(serverId)}&username=${encodeURIComponent(dm.username)}&userId=${encodeURIComponent(dm.user_id)}`;
            router.push(dmUrl);
        } catch (error) {
            alert(`${t.error.generic}: ${error}`);
        }
    };

    const handleToggleDmNotifications = () => {
        setIsDmNotifOpen((prev) => {
            const next = !prev;
            if (next) {
                setUnreadDmCount(0);
            }
            return next;
        });
    };

    const handleOpenDmFromNotification = (notif: DmHeaderNotification) => {
        setIsDmNotifOpen(false);
        const dmUrl = `/dm/${notif.channel_id}?serverId=${encodeURIComponent(notif.server_id)}&username=${encodeURIComponent(notif.from_username)}&userId=${encodeURIComponent(notif.from_user_id)}`;
        router.push(dmUrl);
    };

    if (loading) {
        return (
            <RequireAuth>
                <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
                    <div className="text-center">
                        <div className="text-yellow-400 text-2xl font-black mb-4" style={{ fontFamily: 'monospace' }}>
                            {t.common.loading}
                        </div>
                        <div className="w-64 h-1 bg-gray-800 overflow-hidden">
                            <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '50%' }}></div>
                        </div>
                    </div>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
        <div className="h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes glitch {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
                        50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
                    }
                    .message-hover:hover {
                        background: rgba(255, 215, 0, 0.05);
                    }
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 8px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.3);
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: rgba(255, 215, 0, 0.3);
                        border-radius: 4px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 215, 0, 0.5);
                    }
                `
            }} />

            {/* Header */}
            <ServerHeader
                server={server}
                selectedChannel={selectedChannel}
                wsStatus={wsStatus}
                copied={copied}
                isOwner={isOwner}
                canLeave={canLeave}
                dmNotifications={dmNotifications}
                unreadDmCount={unreadDmCount}
                isDmNotifOpen={isDmNotifOpen}
                onCopyInvite={handleCopyInvite}
                onShowLeaveModal={() => setShowLeaveModal(true)}
                onShowDeleteModal={() => setShowDeleteModal(true)}
                onToggleDmNotifications={handleToggleDmNotifications}
                onCloseDmNotifications={() => setIsDmNotifOpen(false)}
                onOpenDmFromNotification={handleOpenDmFromNotification}
            />

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar gauche - Channels */}
                <ChannelList
                    channels={channels}
                    selectedChannel={selectedChannel}
                    serverId={serverId}
                    onSelectChannel={setSelectedChannel}
                    onDeleteChannel={handleDeleteChannel}
                    currentUserRole={currentUserRole.role_id ?? undefined}
                />

                {/* Chat principal */}
                <main className="flex-1 flex flex-col bg-black/40">
                    {/* Messages */}
                    <div className="flex-1 overflow-auto scrollbar-thin p-4">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-yellow-400/50 text-xl font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                                        {t.message.noMessages}
                                    </div>
                                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                                        {t.message.firstMessage}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const messageAuthorRoleId = members.find((member) => member.user_id === message.user_id)?.role_id ?? null;
                                return (
                                    <MessageItem
                                        key={message.message_id}
                                        message={message}
                                        currentUserId={sessionUserId}
                                        currentUserRoleId={currentUserRole.role_id}
                                        messageAuthorRoleId={messageAuthorRoleId}
                                        onDelete={handleDeleteMessage}
                                        onUpdate={handleUpdateMessage}
                                        availableReactions={availableReactions}
                                        onToggleReaction={handleToggleReaction}
                                    />
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Indicateur "en train d'écrire" */}
                    <TypingIndicator typingUsers={typingUsers} />

                    {/* Input message */}
                    <MessageInput
                        newMessage={newMessage}
                        onChange={handleMessageChange}
                        onSubmit={handleSendMessage}
                        onGifSelect={handleGifSelect}
                        selectedChannel={selectedChannel}
                        sending={sending}
                    />
                </main>

                {/* Sidebar droite - Membres */}
                <MemberList 
                    members={members} 
                    onlineMembers={onlineMembers}
                    serverId={serverId}
                    onMemberUpdate={loadMembers}
                    onStartPrivateMessage={handleStartPrivateMessage}
                />
            </div>

            {/* Modals */}
            <ServerModals
                showLeaveModal={showLeaveModal}
                showDeleteModal={showDeleteModal}
                deleteConfirmName={deleteConfirmName}
                actionLoading={actionLoading}
                server={server}
                onCloseLeaveModal={() => setShowLeaveModal(false)}
                onCloseDeleteModal={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmName("");
                }}
                onLeaveServer={handleLeaveServer}
                onDeleteServer={handleDeleteServer}
                onDeleteConfirmNameChange={setDeleteConfirmName}
            />

        </div>
        </RequireAuth>
    );
}
