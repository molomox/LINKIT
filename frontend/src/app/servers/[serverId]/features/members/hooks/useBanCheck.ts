import { useEffect, useRef } from "react";
import type { Member } from "../../../types";

interface UseBanCheckProps {
    members: Member[];
    onBanned: () => void;
}

export function useBanCheck({ members, onBanned }: UseBanCheckProps) {
    const hasHandledBanRef = useRef(false);

    useEffect(() => {
        if (members.length > 0 && typeof window !== 'undefined') {
            const currentUserId = sessionStorage.getItem("user_id");
            if (currentUserId) {
                const currentMember = members.find(m => m.user_id === currentUserId);
                if (currentMember && currentMember.role_id === 'role01') {
                    if (!hasHandledBanRef.current) {
                        hasHandledBanRef.current = true;
                        console.log('🚫 Utilisateur banni détecté, redirection...');
                        onBanned();
                    }
                    return;
                }

                hasHandledBanRef.current = false;
            }
        }
    }, [members, onBanned]);
}
