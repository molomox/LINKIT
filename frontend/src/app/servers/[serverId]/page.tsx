"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWebSocket, type WsMessage } from "@/hooks/useWebSocket";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import type { Message } from "./types";
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
import * as serverActions from "./utils/serverActions";
import * as messageActions from "./utils/messageActions";

export default function ServerPage() {
    const router = useRouter();
    const params = useParams();
    const serverId = params.serverId as string;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    // Custom hooks
    const { server, channels, selectedChannel, loading, setChannels, setSelectedChannel } = useServerData({
        serverId,
        apiBase,
    });

    const { members, onlineMembers, loadMembers, setOnlineMembers } = useMembers({ serverId, apiBase });
    const { messages, setMessages, loadMessages } = useMessages({ selectedChannel, apiBase });

    // State
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChannel || sending) return;

        setSending(true);
        try {
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username") || "Utilisateur";

            if (isConnected) {
                const wsMessage: WsMessage = {
                    type: 'new_message',
                    content: newMessage,
                    user_id: userId || undefined,
                    username: username,
                    channel_id: selectedChannel.channel_id,
                    server_id: serverId,
                };
                sendWsMessage(wsMessage);
                setNewMessage("");
            } else {
                console.log('⚠️ WebSocket non connecté, utilisation de l\'API REST');
                const res = await fetch(`${apiBase}/channels/${selectedChannel.channel_id}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: newMessage,
                        user_id: userId
                    }),
                });

                if (res.ok) {
                    setNewMessage("");
                    await loadMessages();
                }
            }
        } catch (error) {
            console.error("Erreur envoi message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (isConnected && selectedChannel) {
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username") || "Utilisateur";

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                sendWsMessage({
                    type: 'typing',
                    user_id: userId || undefined,
                    username: username,
                    channel_id: selectedChannel.channel_id,
                });
            }, 500);
        }
    };

    const getCurrentUserRole = (): { role_id: string | null; role_name: string | null } => {
        if (typeof window === 'undefined') return { role_id: null, role_name: null };
        
        const userId = sessionStorage.getItem("user_id");
        if (!userId) return { role_id: null, role_name: null };

        const member = members.find(m => m.user_id === userId);
        return {
            role_id: member?.role_id || null,
            role_name: member?.role_name || null
        };
    };

    const currentUserRole = getCurrentUserRole();
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
            console.error("Erreur lors de la copie:", error);
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
            alert("Le nom du serveur ne correspond pas.");
            return;
        }
        setActionLoading(true);
        try {
            await serverActions.deleteServer(serverId, apiBase);
            router.push("/auth/me");
        } catch (error) {
            alert(`Erreur: ${error}`);
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
            alert(`Erreur: ${error}`);
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
            alert(`Erreur: ${error}`);
        }
    };

    // Channel action handlers
    const handleDeleteChannel = async (channelId: string, channelName: string) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('Vous devez être connecté pour supprimer un channel');
                return;
            }

            const res = await fetch(`${apiBase}/channels/${channelId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errText = await res.text();
                alert(`Erreur lors de la suppression : ${errText}`);
                return;
            }

            console.log(`✅ Channel #${channelName} supprimé avec succès`);
            // Le WebSocket mettra à jour automatiquement la liste des channels via useServerEvents
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression du channel');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
                <div className="text-center">
                    <div className="text-yellow-400 text-2xl font-black mb-4" style={{ fontFamily: 'monospace' }}>
                        CHARGEMENT...
                    </div>
                    <div className="w-64 h-1 bg-gray-800 overflow-hidden">
                        <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '50%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
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
                onCopyInvite={handleCopyInvite}
                onShowLeaveModal={() => setShowLeaveModal(true)}
                onShowDeleteModal={() => setShowDeleteModal(true)}
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
                                        Aucun message
                                    </div>
                                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                                        Soyez le premier à écrire !
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageItem
                                    key={message.message_id}
                                    message={message}
                                    currentUserId={typeof window !== 'undefined' ? sessionStorage.getItem("user_id") : null}
                                    currentUserRole={currentUserRole.role_name}
                                    onDelete={handleDeleteMessage}
                                    onUpdate={handleUpdateMessage}
                                />
                            ))
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
    );
}
