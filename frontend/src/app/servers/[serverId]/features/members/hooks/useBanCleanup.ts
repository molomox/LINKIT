import { useCallback, useEffect } from "react";
import { buildAuthHeaders } from "@/utils/authHeaders";

interface UseBanCleanupProps {
    serverId: string;
    apiBase: string;
    onMembersUpdate: () => Promise<void>;
}

export function useBanCleanup({ serverId, apiBase, onMembersUpdate }: UseBanCleanupProps) {
    const cleanupExpiredBans = useCallback(async () => {
        try {
            const response = await fetch(`${apiBase}/servers/${serverId}/cleanup-bans`, {
                method: "POST",
                headers: buildAuthHeaders(),
            });

            if (response.ok) {
                const unbannedUsers = await response.json();
                if (unbannedUsers.length > 0) {
                    console.log('✅ Bans expirés nettoyés:', unbannedUsers);
                    await onMembersUpdate();
                }
            }
        } catch (error) {
            console.error("Erreur nettoyage bans expirés:", error);
        }
    }, [serverId, apiBase, onMembersUpdate]);

    // Vérifier périodiquement les bans expirés (toutes les 2 secondes)
    useEffect(() => {
        const interval = setInterval(() => {
            cleanupExpiredBans();
        }, 2000);

        return () => clearInterval(interval);
    }, [cleanupExpiredBans]);

    return { cleanupExpiredBans };
}
