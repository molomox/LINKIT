import { useEffect, useRef, useState, useCallback } from 'react';

export type WsMessage = {
    type: 'new_message' | 'user_joined' | 'user_left' | 'typing' | 'message_updated' | 'message_deleted' | 'reaction_toggled' | 'ping' | 'pong';
    message_id?: string;
    content?: string;
    user_id?: string;
    username?: string;
    channel_id?: string;
    server_id?: string;
    create_at?: string;
    is_gif?: boolean;
    reaction_id?: number;
    emoji?: string;
    reaction_name?: string;
    status?: string;
};

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const useWebSocket = (channelId: string | null) => {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);
    const channelIdRef = useRef<string | null>(channelId);
    const manualCloseRef = useRef(false);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

    // Mettre à jour la ref du channelId
    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    // Stocker la fonction connect dans une ref pour éviter les dépendances circulaires
    const connectRef = useRef<(() => void) | null>(null);

    /**
     * Connexion au WebSocket
     */
    const connect = useCallback(() => {
        const currentChannelId = channelIdRef.current;
        if (!currentChannelId) return;

        try {
            manualCloseRef.current = false;
            setStatus('connecting');
            const ws = new WebSocket(`${wsUrl}/ws/channels/${currentChannelId}`);

            ws.onopen = () => {
                console.log(`🟢 WebSocket connecté au channel: ${currentChannelId}`);
                setStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message: WsMessage = JSON.parse(event.data);
                    console.log('📨 Message WS reçu:', message);
                    setLastMessage(message);
                } catch (error) {
                    console.error('❌ Erreur parsing message WS:', error);
                }
            };

            ws.onerror = () => {
                if (manualCloseRef.current || wsRef.current !== ws) {
                    return;
                }

                console.warn('WebSocket channel en erreur, tentative de reconnexion...');
                setStatus('error');
            };

            ws.onclose = (event) => {
                console.log(`🔴 WebSocket déconnecté du channel: ${currentChannelId}`);
                if (wsRef.current === ws) {
                    setStatus('disconnected');
                    wsRef.current = null;
                }

                if (wsRef.current !== ws) {
                    return;
                }

                if (manualCloseRef.current) {
                    return;
                }

                // Tentative de reconnexion exponentielle
                if (reconnectAttemptsRef.current < 5) {
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`🔄 Tentative de reconnexion dans ${timeout}ms... (code ${event.code})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        connectRef.current?.();
                    }, timeout);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.warn('Erreur lors de la creation de la connexion WebSocket:', error);
            setStatus('error');
        }
    }, [wsUrl]);

    // Mettre à jour la ref avec la fonction connect
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
            manualCloseRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
        }

        setStatus('disconnected');
        reconnectAttemptsRef.current = 0;
    }, []);

    /**
     * Envoyer un message via WebSocket
     */
    const sendMessage = useCallback((message: WsMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            console.log('📤 Message WS envoyé:', message);
        } else {
            console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer le message');
        }
    }, []);

    /**
     * Connexion/déconnexion automatique
     */
    useEffect(() => {
        if (channelId) {
            // Utiliser setTimeout pour rendre l'appel asynchrone
            const timer = setTimeout(() => {
                connect();
            }, 0);

            return () => {
                clearTimeout(timer);
                disconnect();
            };
        }
    }, [channelId, connect, disconnect]);

    /**
     * Heartbeat (ping/pong)
     */
    useEffect(() => {
        if (status === 'connected') {
            const interval = setInterval(() => {
                sendMessage({ type: 'ping' });
            }, 30000); // Ping toutes les 30 secondes

            return () => clearInterval(interval);
        }
    }, [status, sendMessage]);

    return {
        status,
        lastMessage,
        sendMessage,
        connect,
        disconnect,
        isConnected: status === 'connected',
    };
};
