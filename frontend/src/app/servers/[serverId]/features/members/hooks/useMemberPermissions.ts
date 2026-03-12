import { useState, useEffect } from "react";
import type { Member } from "../../../types";

export const roleOptions = [
    { id: 'role04', name: 'Owner', color: '#FF0000' },
    { id: 'role03', name: 'Admin', color: '#FFA500' },
    { id: 'role02', name: 'Membre', color: '#00FF00' },
    { id: 'role01', name: 'Ban', color: '#808080' },
];

export function useMemberPermissions(members: Member[]) {
    // Récupérer le rôle de l'utilisateur actuel
    const getCurrentUserRole = (): string | null => {
        if (typeof window === 'undefined') return null;
        
        const currentUserId = sessionStorage.getItem('user_id');
        if (!currentUserId) return null;
        
        const currentMember = members.find(m => m.user_id === currentUserId);
        return currentMember?.role_id || null;
    };

    // Filtrer les rôles disponibles selon les permissions
    const getAvailableRoles = (currentUserRoleId: string | null) => {
        if (currentUserRoleId === 'role04') {
            // Owner peut assigner : Admin, Membre, Ban
            return roleOptions;
        } else if (currentUserRoleId === 'role03') {
            // Admin peut assigner : Membre, Ban
            return roleOptions.filter(r => r.id === 'role01' || r.id === 'role02');
        }
        // Membre et Ban ne peuvent rien assigner
        return [];
    };

    // Vérifier si l'utilisateur actuel peut kick un membre
    const canKickMember = (targetMember: Member): boolean => {
        const currentUserRoleId = getCurrentUserRole();
        
        // Owner ne peut pas être kické
        if (targetMember.role_id === 'role04') {
            return false;
        }
        
        // Owner peut kick tout le monde (sauf Owner)
        if (currentUserRoleId === 'role04') {
            return true;
        }
        
        // Admin peut kick Membre et Ban
        if (currentUserRoleId === 'role03') {
            return targetMember.role_id === 'role01' || targetMember.role_id === 'role02';
        }
        
        return false;
    };

    const canBanMember = (targetMember: Member): boolean => {
        const currentUserRoleId = getCurrentUserRole();

        if (targetMember.role_id === "role04") {
            return false;
        }

        if (currentUserRoleId === "role04") {
            return true;
        }

        if (currentUserRoleId === "role03") {
            return targetMember.role_id === "role01" || targetMember.role_id === "role02";
        }
        return false;
    };

    const canManageBan = (targetMember: Member): boolean => {
        const currentUserRoleId = getCurrentUserRole();

        if (targetMember.role_id === "role04") {
            return false;
        }

        if (currentUserRoleId === "role04") {
            return true;
        }

        if (currentUserRoleId === "role03") {
            return targetMember.role_id === "role01" || targetMember.role_id === "role02";
        }
        return false;
    };

    const canShowContextMenu = (member: Member): boolean => {
        if (typeof window === 'undefined') return false;
        
        const currentUserRoleId = getCurrentUserRole();
        const availableRoles = getAvailableRoles(currentUserRoleId);
        const canKick = canKickMember(member);
        
        // Ne pas afficher le menu si aucune permission
        if (availableRoles.length === 0 && !canKick) {
            return false;
        }
        
        // Ne pas permettre d'interagir avec soi-même
        const currentUserId = sessionStorage.getItem('user_id');
        if (member.user_id === currentUserId) {
            return false;
        }
        
        // Ne pas permettre d'interagir avec un Owner
        if (member.role_id === 'role04') {
            return false;
        }
        
        return true;
    };

    return {
        getCurrentUserRole,
        getAvailableRoles,
        canKickMember,
        canBanMember,
        canManageBan,
        canShowContextMenu,
        roleOptions,
    };
}
