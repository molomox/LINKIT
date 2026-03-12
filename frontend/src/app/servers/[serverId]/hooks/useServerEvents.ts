import { useEffect, useRef } from "react";
import type { Channel, Member } from "../types";
import type { ServerWsMessage } from "@/hooks/useServerWebSocket";

interface UseServerEventsProps {
    lastServerMessage: ServerWsMessage | null;
    selectedChannel: Channel | null;
    onChannelsUpdate: (updater: (prev: Channel[]) => Channel[]) => void;
    onSelectedChannelUpdate: (channel: Channel | null) => void;
    onMembersReload: () => void;
    onRedirect: (path: string) => void;
    onOnlineMembersUpdate: (updater: (prev: Set<string>) => Set<string>) => void;
}

export function useServerEvents({
    lastServerMessage,
    selectedChannel,
    onChannelsUpdate,
    onSelectedChannelUpdate,
    onMembersReload,
    onRedirect,
    onOnlineMembersUpdate,
}: UseServerEventsProps) {
    // Tracker le dernier message traité pour éviter les doublons
    const lastProcessedMessageRef = useRef<ServerWsMessage | null>(null);

    useEffect(() => {
        if (!lastServerMessage) return;

        // Éviter de traiter le même message plusieurs fois (comparaison par contenu)
        if (lastProcessedMessageRef.current && 
            JSON.stringify(lastProcessedMessageRef.current) === JSON.stringify(lastServerMessage)) {
            console.log('⏭️ Message identique déjà traité, ignoré');
            return;
        }
        
        lastProcessedMessageRef.current = lastServerMessage;
        console.log('📨 Événement serveur WebSocket reçu:', lastServerMessage);

        switch (lastServerMessage.type) {
            case 'channel_created': {
                const newChannel: Channel = {
                    channel_id: lastServerMessage.channel_id!,
                    name: lastServerMessage.name!,
                    server_id: lastServerMessage.server_id!,
                    create_at: lastServerMessage.create_at!,
                };

                onChannelsUpdate(prev => {
                    if (prev.find(c => c.channel_id === newChannel.channel_id)) {
                        return prev;
                    }
                    console.log('✅ Nouveau canal ajouté:', newChannel.name);
                    return [...prev, newChannel];
                });
                break;
            }

            case 'channel_updated': {
                onChannelsUpdate(prev => prev.map(channel =>
                    channel.channel_id === lastServerMessage.channel_id
                        ? { ...channel, name: lastServerMessage.name! }
                        : channel
                ));

                if (selectedChannel && selectedChannel.channel_id === lastServerMessage.channel_id && lastServerMessage.name) {
                    onSelectedChannelUpdate({
                        channel_id: selectedChannel.channel_id,
                        name: lastServerMessage.name,
                        server_id: selectedChannel.server_id,
                        create_at: selectedChannel.create_at,
                    });
                }
                break;
            }

            case 'channel_deleted': {
                onChannelsUpdate(prev => {
                    const filtered = prev.filter(channel => channel.channel_id !== lastServerMessage.channel_id);
                    if (selectedChannel?.channel_id === lastServerMessage.channel_id && filtered.length > 0) {
                        onSelectedChannelUpdate(filtered[0]);
                    } else if (filtered.length === 0) {
                        onSelectedChannelUpdate(null);
                    }
                    return filtered;
                });
                break;
            }

            case 'member_joined':
            case 'member_role_changed':
                onMembersReload();
                break;

            case 'member_kicked': {
                const currentUserId = sessionStorage.getItem('user_id');
                console.log('🔍 member_kicked event:', {
                    kickedUserId: lastServerMessage.user_id,
                    currentUserId: currentUserId,
                    matches: lastServerMessage.user_id === currentUserId,
                });
                if (lastServerMessage.user_id === currentUserId) {
                    alert('Vous avez été expulsé de ce serveur');
                    console.log('🚪 Redirecting to /auth/me');
                    onRedirect('/auth/me');
                } else {
                    console.log('📋 Reloading members list');
                    onMembersReload();
                }
                break;
            }

            case 'member_banned': {
                const currentUserId = sessionStorage.getItem('user_id');
                if (lastServerMessage.user_id === currentUserId) {
                    alert(`Vous avez été banni de ce serveur.\nRaison: ${lastServerMessage.reason || 'Non spécifiée'}`);
                    onRedirect('/auth/me');
                } else {
                    onMembersReload();
                }
                break;
            }

            case 'user_online':
                if (lastServerMessage.user_id) {
                    onOnlineMembersUpdate(prev => {
                        // Éviter de recréer le Set si l'utilisateur est déjà en ligne
                        if (prev.has(lastServerMessage.user_id!)) {
                            return prev;
                        }
                        const newSet = new Set(prev);
                        newSet.add(lastServerMessage.user_id!);
                        return newSet;
                    });
                }
                break;

            case 'user_offline':
                if (lastServerMessage.user_id) {
                    onOnlineMembersUpdate(prev => {
                        // Éviter de recréer le Set si l'utilisateur n'est pas en ligne
                        if (!prev.has(lastServerMessage.user_id!)) {
                            return prev;
                        }
                        const newSet = new Set(prev);
                        newSet.delete(lastServerMessage.user_id!);
                        return newSet;
                    });
                }
                break;
        }
    }, [lastServerMessage, selectedChannel, onChannelsUpdate, onSelectedChannelUpdate, onMembersReload, onRedirect, onOnlineMembersUpdate]);
}
