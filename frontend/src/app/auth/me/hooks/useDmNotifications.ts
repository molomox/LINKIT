"use client";

import { useEffect, useRef, useState } from "react";
import type { DmRealtimeNotification, Server } from "../types";

type UseDmNotificationsArgs = {
    servers: Server[];
    wsBase: string;
};

export function useDmNotifications({ servers, wsBase }: UseDmNotificationsArgs) {
    const [dmNotifications, setDmNotifications] = useState<DmRealtimeNotification[]>([]);
    const [unreadDmCount, setUnreadDmCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const wsConnectionsRef = useRef<WebSocket[]>([]);
    const notifOpenRef = useRef(false);

    useEffect(() => {
        notifOpenRef.current = isNotifOpen;
    }, [isNotifOpen]);

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const username = sessionStorage.getItem("username");

        wsConnectionsRef.current.forEach((socket) => socket.close());
        wsConnectionsRef.current = [];

        if (!userId || !username || servers.length === 0) {
            return;
        }

        const uniqueServerIds = Array.from(new Set(servers.map((s) => s.id)));
        const sockets = uniqueServerIds.map((serverId) => {
            const ws = new WebSocket(`${wsBase}/ws/servers/${serverId}`);

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        type: "identify",
                        user_id: userId,
                        username,
                    }),
                );
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as {
                        type?: string;
                        to_user_id?: string;
                        from_user_id?: string;
                        from_username?: string;
                        preview?: string;
                        is_gif?: boolean;
                        channel_id?: string;
                        server_id?: string;
                    };

                    if (message.type !== "dm_message" || message.to_user_id !== userId) {
                        return;
                    }

                    const notification: DmRealtimeNotification = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        channel_id: message.channel_id || "",
                        server_id: message.server_id || serverId,
                        from_user_id: message.from_user_id || "",
                        from_username: message.from_username || "Utilisateur",
                        preview: message.is_gif ? "a envoye un GIF" : (message.preview || "Nouveau message"),
                        is_gif: !!message.is_gif,
                    };

                    setDmNotifications((prev) => [notification, ...prev].slice(0, 10));
                    if (!notifOpenRef.current) {
                        setUnreadDmCount((prev) => prev + 1);
                    }
                } catch {
                    // Ignore malformed websocket payloads.
                }
            };

            return ws;
        });

        wsConnectionsRef.current = sockets;

        return () => {
            sockets.forEach((socket) => socket.close());
            wsConnectionsRef.current = [];
        };
    }, [servers, wsBase]);

    const toggleNotifications = () => {
        setIsNotifOpen((prev) => {
            const next = !prev;
            if (next) {
                setUnreadDmCount(0);
            }
            return next;
        });
    };

    return {
        dmNotifications,
        unreadDmCount,
        isNotifOpen,
        setIsNotifOpen,
        toggleNotifications,
    };
}
