import { useState, useEffect } from "react";
import type { Server, Channel } from "../types";

interface UseServerDataProps {
    serverId: string;
    apiBase: string;
    onLoadComplete?: () => void;
}

export function useServerData({ serverId, apiBase, onLoadComplete }: UseServerDataProps) {
    const [server, setServer] = useState<Server | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadServerData = async () => {
            try {
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
                            if (channelsData && channelsData.length > 0) {
                                setChannels(channelsData);
                                setSelectedChannel(channelsData[0]);
                            }
                        }
                    }
                }

                setLoading(false);
                onLoadComplete?.();
            } catch (error) {
                console.error("Erreur chargement serveur:", error);
                setLoading(false);
            }
        };

        loadServerData();
    }, [serverId, apiBase, onLoadComplete]);

    return {
        server,
        channels,
        selectedChannel,
        loading,
        setChannels,
        setSelectedChannel,
    };
}
