import { useEffect } from "react";
import type { Member } from "../../../types";

interface UseBanCheckProps {
    members: Member[];
    onBanned: () => void;
}

export function useBanCheck({ members, onBanned }: UseBanCheckProps) {
    useEffect(() => {
        if (members.length > 0 && typeof window !== 'undefined') {
            const currentUserId = sessionStorage.getItem("user_id");
            if (currentUserId) {
                const currentMember = members.find(m => m.user_id === currentUserId);
                if (currentMember && currentMember.role_id === 'role01') {
                    console.log('🚫 Utilisateur banni détecté, redirection...');
                    alert('Vous êtes banni de ce serveur.');
                    onBanned();
                }
            }
        }
    }, [members, onBanned]);
}
