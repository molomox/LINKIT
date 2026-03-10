"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWebSocket, type WsMessage } from "@/hooks/useWebSocket";
import { useServerWebSocket } from "@/hooks/useServerWebSocket";
import type { Message, ApiMessage, Member, ApiMember, Server, Channel } from "./types";
import MessageItem from "./components/MessageItem";
import TypingIndicator from "./components/TypingIndicator";
import MessageInput from "./components/MessageInput";
import ChannelList from "./components/ChannelList";
import MemberList from "./components/MemberList";
import ServerModals from "./components/ServerModals";
import ServerHeader from "./components/ServerHeader";

export default function ServerPage() {
    const router = useRouter();
    const params = useParams();
    const serverId = params.serverId as string;

    const [server, setServer] = useState<Server | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    // Utiliser le hook WebSocket pour les messages de canal
    const { status: wsStatus, lastMessage, sendMessage: sendWsMessage, isConnected } = useWebSocket(
        selectedChannel?.channel_id || null
    );

    // Utiliser le hook WebSocket pour les événements de serveur (création/suppression de canaux)
    const { lastMessage: lastServerMessage } = useServerWebSocket(serverId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadMessages = useCallback(async () => {
        if (!selectedChannel) return;

        try {
            const messagesRes = await fetch(`${apiBase}/channels/${selectedChannel.channel_id}/messages`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (messagesRes.ok) {
                const messagesData: ApiMessage[] = await messagesRes.json();

                // Transformer les messages pour extraire username depuis user.username
                const transformedMessages: Message[] = messagesData.map((msg) => ({
                    message_id: msg.message_id,
                    content: msg.content,
                    user_id: msg.user?.user_id || msg.user_id,
                    username: msg.user?.username || msg.username || "Utilisateur",
                    create_at: msg.create_at,
                }));

                setMessages(transformedMessages);
            }
        } catch (error) {
            console.error("Erreur chargement messages:", error);
        }
    }, [selectedChannel, apiBase]);

    const loadMembers = useCallback(async () => {
        try {
            const membersRes = await fetch(`${apiBase}/servers/${serverId}/members`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (membersRes.ok) {
                const membersData: ApiMember[] = await membersRes.json();
                console.log('📥 Membres bruts de l\'API:', membersData);

                // Transformer les données de l'API vers le format Member
                const transformedMembers: Member[] = membersData.map((m: any) => {
                    console.log('🔵 Membre original complet:', JSON.stringify(m, null, 2));
                    console.log('🔵 m.role =', m.role);
                    console.log('🔵 m.role.role_id =', m.role ? m.role.role_id : 'role est null/undefined');
                    console.log('🔵 m.role_id direct =', m.role_id);
                    
                    // Test explicite
                    let roleId = 'role02'; // défaut
                    if (m.role && typeof m.role === 'object' && m.role.role_id) {
                        roleId = m.role.role_id;
                        console.log('✅ role_id trouvé dans m.role:', roleId);
                    } else if (m.role_id) {
                        roleId = m.role_id;
                        console.log('✅ role_id trouvé directement:', roleId);
                    } else {
                        console.log('❌ Aucun role_id trouvé, utilisation de la valeur par défaut');
                    }
                    
                    const result = {
                        user_id: (m.user && m.user.user_id) || m.user_id || '',
                        username: (m.user && m.user.username) || m.username || 'Utilisateur inconnu',
                        role_name: (m.role && m.role.role_name) || m.role_name || 'Membre',
                        role_id: roleId,
                        join_at: m.join_at || new Date().toISOString(),
                    };
                    
                    console.log('🟢 Résultat transformation:', result);
                    return result;
                });

                console.log('✅ Membres transformés:', transformedMembers);
                console.log('🎯 AVANT setMembers - Premier membre role_id:', transformedMembers[0]?.role_id);
                setMembers(transformedMembers);
            }
        } catch (error) {
            console.error("Erreur chargement membres:", error);
        }
    }, [serverId, apiBase]);

    useEffect(() => {
        const loadServerData = async () => {
            try {
                const userId = sessionStorage.getItem("user_id");
                if (!userId) {
                    router.push("/auth/login");
                    return;
                }

                // Charger les infos du serveur
                const serverRes = await fetch(`${apiBase}/servers/${serverId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (serverRes.ok) {
                    const serverData = await serverRes.json();
                    setServer(serverData);

                    // Charger les channels du serveur
                    if (serverData.all_channels && serverData.all_channels.length > 0) {
                        setChannels(serverData.all_channels);
                        setSelectedChannel(serverData.all_channels[0]);
                    } else {
                        // Si all_channels est vide, essayer de charger directement
                        const channelsRes = await fetch(`${apiBase}/servers/${serverId}/channels`, {
                            method: "GET",
                            headers: { "Content-Type": "application/json" },
                        });

                        if (channelsRes.ok) {
                            const channelsData = await channelsRes.json();
                            console.log("✅ Channels chargés:", channelsData);
                            if (channelsData && channelsData.length > 0) {
                                setChannels(channelsData);
                                setSelectedChannel(channelsData[0]);
                            }
                        }
                    }
                }

                // Charger les membres
                await loadMembers();

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement serveur:", error);
                setLoading(false);
            }
        };

        loadServerData();
    }, [serverId, router, apiBase]);

    useEffect(() => {
        if (selectedChannel) {
            loadMessages();
        }
    }, [selectedChannel, loadMessages]);

    // Initialiser les membres en ligne lorsqu'on charge les membres
    useEffect(() => {
        if (members.length > 0) {
            console.log('🔍 Membres chargés:', members);
            const onlineIds = new Set<string>();
            const currentUserId = sessionStorage.getItem("user_id");
            console.log('🔍 Current user ID:', currentUserId);

            // Filtrer les membres valides AVANT la boucle
            const validMembers = members.filter(member =>
                member &&
                member.user_id
            );

            console.log('🔍 Membres valides:', validMembers.length, '/', members.length);

            // Par défaut, seul l'utilisateur actuel est en ligne
            validMembers.forEach((member) => {
                console.log(`🔍 Membre: ${member.username} (${member.user_id}), Est current user: ${member.user_id === currentUserId}`);

                if (member.user_id === currentUserId) {
                    onlineIds.add(member.user_id);
                    console.log('✅ Utilisateur actuel marqué en ligne:', member.username);
                }
            });

            setOnlineMembers(onlineIds);
            console.log('🎯 Membres en ligne:', onlineIds.size, '/', validMembers.length);
        }
    }, [members]);

    // Gérer la connexion WebSocket
    useEffect(() => {
        if (isConnected && selectedChannel) {
            console.log('✅ WebSocket connecté au channel:', selectedChannel.name);

            // L'utilisateur actuel rejoint le channel
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username");

            if (userId && username) {
                // Marquer l'utilisateur comme en ligne localement
                setOnlineMembers(prev => new Set(prev).add(userId));

                // Envoyer automatiquement un message au backend pour déclencher user_joined
                // Ce message invisible permet au backend de capturer user_id et broadcaster user_joined
                sendWsMessage({
                    type: 'new_message',
                    content: '', // Message vide (ne sera pas sauvegardé)
                    user_id: userId,
                    username: username,
                    channel_id: selectedChannel.channel_id,
                    server_id: serverId as string,
                });

                console.log('📤 Message de présence envoyé au backend');
            }
        }
    }, [isConnected, selectedChannel, sendWsMessage, serverId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Écouter les événements de canal en temps réel
    useEffect(() => {
        if (!lastServerMessage) return;

        console.log('📨 Événement serveur WebSocket reçu:', lastServerMessage);

        if (lastServerMessage.type === 'channel_created') {
            // Ajouter le nouveau canal à la liste
            const newChannel: Channel = {
                channel_id: lastServerMessage.channel_id!,
                name: lastServerMessage.name!,
                server_id: lastServerMessage.server_id!,
                create_at: lastServerMessage.create_at!,
            };

            setChannels(prev => {
                // Vérifier si le canal n'existe pas déjà
                if (prev.find(c => c.channel_id === newChannel.channel_id)) {
                    return prev;
                }
                console.log('✅ Nouveau canal ajouté:', newChannel.name);
                return [...prev, newChannel];
            });
        } else if (lastServerMessage.type === 'channel_updated') {
            // Mettre à jour le canal dans la liste
            setChannels(prev => prev.map(channel =>
                channel.channel_id === lastServerMessage.channel_id
                    ? { ...channel, name: lastServerMessage.name! }
                    : channel
            ));

            // Mettre à jour aussi le canal sélectionné si c'est celui-ci
            if (selectedChannel?.channel_id === lastServerMessage.channel_id) {
                setSelectedChannel(prev => prev ? { ...prev, name: lastServerMessage.name! } : null);
            }

            console.log('✅ Canal mis à jour:', lastServerMessage.name);
        } else if (lastServerMessage.type === 'channel_deleted') {
            // Retirer le canal de la liste
            setChannels(prev => prev.filter(channel => channel.channel_id !== lastServerMessage.channel_id));

            // Si le canal supprimé était sélectionné, sélectionner le premier canal disponible
            if (selectedChannel?.channel_id === lastServerMessage.channel_id) {
                setChannels(prev => {
                    if (prev.length > 0) {
                        setSelectedChannel(prev[0]);
                    } else {
                        setSelectedChannel(null);
                    }
                    return prev;
                });
            }

            console.log('✅ Canal supprimé:', lastServerMessage.channel_id);
        } else if (lastServerMessage.type === 'member_joined') {
            // Un nouveau membre a rejoint le serveur
            console.log('👤 Nouveau membre rejoint le serveur:', lastServerMessage.username);
            
            // Recharger la liste des membres pour inclure le nouveau membre
            loadMembers();
        } else if (lastServerMessage.type === 'member_role_changed') {
            // Le rôle d'un membre a changé
            console.log('🔄 Rôle de membre mis à jour:', lastServerMessage.username, '->', lastServerMessage.role_name);
            
            // Recharger la liste des membres pour mettre à jour les rôles
            loadMembers();
        } else if (lastServerMessage.type === 'member_kicked') {
            // Un membre a été kické
            console.log('👢 Membre kické:', lastServerMessage.username);
            
            // Vérifier si c'est l'utilisateur actuel qui a été kické
            const currentUserId = sessionStorage.getItem('user_id');
            if (lastServerMessage.user_id === currentUserId) {
                // L'utilisateur actuel a été kické, le rediriger
                alert('Vous avez été expulsé de ce serveur');
                router.push('/auth/me');
            } else {
                // Recharger la liste des membres
                loadMembers();
            }
        } else if (lastServerMessage.type === 'user_online') {
            // Un utilisateur s'est connecté
            console.log('🟢 Utilisateur en ligne:', lastServerMessage.username);
            
            if (lastServerMessage.user_id) {
                setOnlineMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(lastServerMessage.user_id!);
                    return newSet;
                });
            }
        } else if (lastServerMessage.type === 'user_offline') {
            // Un utilisateur s'est déconnecté
            console.log('🔴 Utilisateur hors ligne:', lastServerMessage.username);
            
            if (lastServerMessage.user_id) {
                setOnlineMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lastServerMessage.user_id!);
                    return newSet;
                });
            }
        }
    }, [lastServerMessage, selectedChannel]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Écouter les messages WebSocket en temps réel
    useEffect(() => {
        if (!lastMessage) return;

        console.log('📨 Message WebSocket reçu:', lastMessage);

        if (lastMessage.type === 'new_message') {
            // Créer un nouveau message à partir des données WebSocket
            const newMsg: Message = {
                message_id: lastMessage.message_id || '',
                content: lastMessage.content || '',
                user_id: lastMessage.user_id || '',
                username: lastMessage.username || '',
                create_at: lastMessage.create_at || new Date().toISOString(),
            };

            // Marquer l'utilisateur comme en ligne (activité récente)
            if (lastMessage.user_id) {
                setOnlineMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(lastMessage.user_id!);
                    return newSet;
                });
            }

            // Vérifier que le message n'existe pas déjà pour éviter les doublons
            setMessages(prevMessages => {
                const exists = prevMessages.some(m => m.message_id === newMsg.message_id);
                if (exists) return prevMessages;
                return [...prevMessages, newMsg];
            });
        } else if (lastMessage.type === 'user_joined') {
            console.log('👤 Utilisateur rejoint:', lastMessage.username);

            // Ne plus afficher de message système - la gestion de présence est maintenant via user_online/user_offline
            
            // Ajouter l'utilisateur aux membres en ligne
            if (lastMessage.user_id) {
                setOnlineMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(lastMessage.user_id!);
                    return newSet;
                });
            }
        } else if (lastMessage.type === 'user_left') {
            console.log('👋 Utilisateur parti:', lastMessage.username);
            // Retirer l'utilisateur des membres en ligne
            if (lastMessage.user_id) {
                setOnlineMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lastMessage.user_id!);
                    return newSet;
                });
            }
        } else if (lastMessage.type === 'typing') {
            // Gérer l'événement "en train d'écrire"
            const currentUserId = sessionStorage.getItem("user_id");

            // Ne pas afficher si c'est l'utilisateur actuel
            if (lastMessage.user_id && lastMessage.user_id !== currentUserId && lastMessage.username) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.add(lastMessage.username!);
                    return newSet;
                });

                // Retirer l'utilisateur après 3 secondes
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(lastMessage.username!);
                        return newSet;
                    });
                }, 3000);
            }
        } else if (lastMessage.type === 'message_updated') {
            // Un message a été modifié
            console.log('✏️ Message mis à jour:', lastMessage.message_id);
            
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.message_id === lastMessage.message_id
                        ? { ...msg, content: lastMessage.content || msg.content }
                        : msg
                )
            );
        } else if (lastMessage.type === 'message_deleted') {
            // Un message a été supprimé
            console.log('🗑️ Message supprimé:', lastMessage.message_id);
            
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg.message_id !== lastMessage.message_id)
            );
        }
    }, [lastMessage]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChannel || sending) return;

        setSending(true);
        try {
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username") || "Utilisateur";

            // Si WebSocket connecté, envoyer via WebSocket
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
                // Sinon, utiliser l'API REST classique
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
                    await loadMessages(); // Recharger les messages
                }
            }
        } catch (error) {
            console.error("Erreur envoi message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleCopyInvite = () => {
        if (server?.invite_code) {
            const inviteLink = `${window.location.origin}/invite/${server.invite_code}`;
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeaveServer = async () => {
        setActionLoading(true);
        try {
            const userId = sessionStorage.getItem("user_id");
            if (!userId) return;

            const res = await fetch(`${apiBase}/servers/${serverId}/leave`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userId),
            });

            if (res.ok) {
                console.log("✅ Serveur quitté avec succès");
                router.push("/auth/me");
            } else {
                const errorText = await res.text();
                console.error("❌ Erreur lors du départ:", errorText);
                alert(`Erreur: ${errorText}`);
            }
        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            alert("Erreur réseau lors du départ du serveur");
        } finally {
            setActionLoading(false);
            setShowLeaveModal(false);
        }
    };

    const handleDeleteServer = async () => {
        if (deleteConfirmName !== server?.name) {
            alert("Le nom du serveur ne correspond pas !");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`${apiBase}/servers/${serverId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                console.log("✅ Serveur supprimé avec succès");
                router.push("/auth/me");
            } else {
                const errorText = await res.text();
                console.error("❌ Erreur lors de la suppression:", errorText);
                alert(`Erreur: ${errorText}`);
            }
        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            alert("Erreur réseau lors de la suppression du serveur");
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
            setDeleteConfirmName("");
        }
    };

    const getCurrentUserRole = (): string | null => {
        if (typeof window === 'undefined') return null;
        
        const userId = sessionStorage.getItem("user_id");
        if (!userId) return null;

        const member = members.find(m => m.user_id === userId);
        return member?.role_name || null;
    };

    const currentUserRole = getCurrentUserRole();
    const isOwner = currentUserRole === "Owner";
    const canLeave = ["membre", "Admin"].includes(currentUserRole || "");

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        // Envoyer un événement "typing" via WebSocket
        if (isConnected && selectedChannel) {
            const userId = sessionStorage.getItem("user_id");
            const username = sessionStorage.getItem("username") || "Utilisateur";

            // Debounce: envoyer seulement une fois toutes les 2 secondes
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

    const handleDeleteMessage = async (messageId: string) => {
        const currentUserId = sessionStorage.getItem("user_id");

        if (!confirm("Voulez-vous vraiment supprimer ce message ?")) {
            return;
        }

        try {
            const res = await fetch(`${apiBase}/messages/${messageId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: currentUserId }),
            });

            if (res.ok) {
                console.log("✅ Message supprimé");
                // Le message sera retiré via WebSocket
            } else {
                const errorText = await res.text();
                console.error("❌ Erreur suppression:", errorText);
                alert(`Erreur: ${errorText}`);
            }
        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            alert("Erreur réseau lors de la suppression");
        }
    };

    const handleUpdateMessage = async (messageId: string, newContent: string) => {
        const currentUserId = sessionStorage.getItem("user_id");

        try {
            const res = await fetch(`${apiBase}/messages/${messageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newContent,
                    user_id: currentUserId,
                }),
            });

            if (res.ok) {
                console.log("✅ Message mis à jour");
                // Le message sera mis à jour via WebSocket
            } else {
                const errorText = await res.text();
                console.error("❌ Erreur mise à jour:", errorText);
                alert(`Erreur: ${errorText}`);
            }
        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            alert("Erreur réseau lors de la mise à jour");
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
                                    currentUserRole={currentUserRole}
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
