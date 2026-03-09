import { useEffect, useRef, useState, useCallback } from 'react';

export type ServerWsMessage = {
    type: 'channel_created' | 'channel_updated' | 'channel_deleted' | 'member_joined' | 'member_role_changed' | 'member_kicked' | 'user_online' | 'user_offline' | 'ping' | 'pong' | 'identify';
    channel_id?: string;
    name?: string;
    server_id?: string;
    create_at?: string;
    user_id?: string;
    username?: string;
    role_id?: string;
    role_name?: string;
};

export type ServerWebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const useServerWebSocket = (serverId: string | null) => {
    const [status, setStatus] = useState<ServerWebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<ServerWsMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);
    const serverIdRef = useRef<string | null>(serverId);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

    // Mettre à jour la ref du serverId
    useEffect(() => {
        serverIdRef.current = serverId;
    }, [serverId]);

    // Stocker la fonction connect dans une ref
    const connectRef = useRef<(() => void) | null>(null);

    /**
     * Connexion au WebSocket
     */
    const connect = useCallback(() => {
        const currentServerId = serverIdRef.current;
        if (!currentServerId) return;

        try {
            setStatus('connecting');
            const ws = new WebSocket(`${wsUrl}/ws/servers/${currentServerId}`);

            ws.onopen = () => {
                console.log(`🟢 WebSocket connecté au serveur: ${currentServerId}`);
                setStatus('connected');
                reconnectAttemptsRef.current = 0;
                
                // Envoyer automatiquement un message d'identification
                const userId = sessionStorage.getItem('user_id');
                const username = sessionStorage.getItem('username');
                
                if (userId && username) {
                    const identifyMsg = {
                        type: 'identify',
                        user_id: userId,
                        username: username,
                    };
                    ws.send(JSON.stringify(identifyMsg));
                    console.log('📤 Message d\'identification envoyé:', username);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message: ServerWsMessage = JSON.parse(event.data);
                    console.log('📨 Message WebSocket serveur reçu:', message);
                    setLastMessage(message);
                } catch (error) {
                    console.error('❌ Erreur parsing message WebSocket:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ Erreur WebSocket serveur:', error);
                setStatus('error');
            };

            ws.onclose = () => {
                console.log('🔴 WebSocket serveur déconnecté');
                setStatus('disconnected');
                wsRef.current = null;

                // Reconnexion automatique avec backoff exponentiel
                const maxAttempts = 5;
                if (reconnectAttemptsRef.current < maxAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`🔄 Tentative de reconnexion dans ${delay}ms (tentative ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        if (connectRef.current) {
                            connectRef.current();
                        }
                    }, delay);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('❌ Erreur création WebSocket serveur:', error);
            setStatus('error');
        }
    }, [wsUrl]);

    // Stocker connect dans la ref via useEffect
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    /**
     * Déconnexion du WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setStatus('disconnected');
        reconnectAttemptsRef.current = 0;
    }, []);

    /**
     * Envoyer un message
     */
    const sendMessage = useCallback((message: ServerWsMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ WebSocket serveur non connecté, impossible d\'envoyer le message');
        }
    }, []);

    // Effet pour gérer la connexion/déconnexion
    useEffect(() => {
        if (serverId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [serverId, connect, disconnect]);

    return {
        status,
        lastMessage,
        sendMessage,
        isConnected: status === 'connected',
        connect,
        disconnect,
    };
};
