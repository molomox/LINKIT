import { useState, useCallback, useEffect } from "react";
import type { Member, ApiMember } from "../../../types";

interface UseMembersProps {
    serverId: string;
    apiBase: string;
}

export function useMembers({ serverId, apiBase }: UseMembersProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const loadMembers = useCallback(async () => {
        try {
            const membersRes = await fetch(`${apiBase}/servers/${serverId}/members`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (membersRes.ok) {
                const membersData: ApiMember[] = await membersRes.json();

                // Transformer les données de l'API vers le format Member
                const transformedMembers: Member[] = membersData.map((m: any) => {
                    let roleId = 'role02'; // défaut
                    if (m.role && typeof m.role === 'object' && m.role.role_id) {
                        roleId = m.role.role_id;
                    } else if (m.role_id) {
                        roleId = m.role_id;
                    }
                    
                    return {
                        user_id: (m.user && m.user.user_id) || m.user_id || '',
                        username: (m.user && m.user.username) || m.username || 'Utilisateur inconnu',
                        role_name: (m.role && m.role.role_name) || m.role_name || 'Membre',
                        role_id: roleId,
                        join_at: m.join_at || new Date().toISOString(),
                    };
                });

                setMembers(transformedMembers);
                setInitialLoadDone(true);
            }
        } catch (error) {
            console.error("Erreur chargement membres:", error);
        }
    }, [serverId, apiBase]);

    // Charger les membres au montage
    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Initialiser les membres en ligne (seulement une fois au premier chargement)
    useEffect(() => {
        if (initialLoadDone) {
            const currentUserId = sessionStorage.getItem("user_id");
            if (currentUserId) {
                setOnlineMembers(new Set([currentUserId]));
                console.log('🟢 Initialized online members with current user:', currentUserId);
            }
        }
    }, [initialLoadDone]);

    return {
        members,
        onlineMembers,
        loadMembers,
        setOnlineMembers,
    };
}
