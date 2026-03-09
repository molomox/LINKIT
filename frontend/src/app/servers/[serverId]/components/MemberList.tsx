"use client";
import { useState } from "react";
import type { Member } from "../types";
import { getRoleColor } from "../../../../utils/roleColors";

type MemberListProps = {
    members: Member[];
    onlineMembers: Set<string>;
    serverId: string;
    onMemberUpdate: () => void;
};

export default function MemberList({ members, onlineMembers, serverId, onMemberUpdate }: MemberListProps) {
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        member: Member;
    } | null>(null);

    const roleOptions = [
        { id: 'role01', name: 'Ban', color: '#6d0101' },
        { id: 'role02', name: 'Membre', color: '#808080' },
        { id: 'role03', name: 'Admin', color: '#FFD700' },
    ];

    // Récupérer le rôle de l'utilisateur actuel
    const getCurrentUserRole = (): string | null => {
        if (typeof window === 'undefined') return null; // Vérification SSR
        
        const currentUserId = sessionStorage.getItem('user_id');
        if (!currentUserId) return null;
        
        const currentMember = members.find(m => m.user_id === currentUserId);
        console.log('👤 Current user:', {
            userId: currentUserId,
            member: currentMember,
            roleId: currentMember?.role_id
        });
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
        
        console.log('🔍 canKickMember:', {
            currentUserRoleId,
            targetMemberRoleId: targetMember.role_id,
            targetUsername: targetMember.username
        });
        
        // Owner ne peut pas être kické
        if (targetMember.role_id === 'role04') {
            console.log('❌ Cannot kick Owner');
            return false;
        }
        
        // Owner peut kick tout le monde (sauf Owner)
        if (currentUserRoleId === 'role04') {
            console.log('✅ Owner can kick this member');
            return true;
        }
        
        // Admin peut kick Membre et Ban
        if (currentUserRoleId === 'role03') {
            const canKick = targetMember.role_id === 'role01' || targetMember.role_id === 'role02';
            console.log('🔍 Admin can kick?', canKick);
            return canKick;
        }
        
        // Membre et Ban ne peuvent pas kick
        console.log('❌ Current role cannot kick');
        return false;
    };

    const handleContextMenu = (e: React.MouseEvent, member: Member) => {
        e.preventDefault();
        
        if (typeof window === 'undefined') return; // Vérification SSR
        
        const currentUserRoleId = getCurrentUserRole();
        const availableRoles = getAvailableRoles(currentUserRoleId);
        const canKick = canKickMember(member);
        
        console.log('🖱️ Context menu:', {
            member: member.username,
            currentUserRoleId,
            availableRolesCount: availableRoles.length,
            canKick
        });
        
        // Ne pas afficher le menu si l'utilisateur n'a aucune permission (ni changer rôle, ni kick)
        if (availableRoles.length === 0 && !canKick) {
            console.log('❌ No permissions - menu not shown');
            return;
        }
        
        // Ne pas permettre de changer le rôle de soi-même
        const currentUserId = sessionStorage.getItem('user_id');
        if (member.user_id === currentUserId) {
            console.log('❌ Cannot interact with self');
            return;
        }
        
        // Ne pas permettre d'interagir avec un Owner
        if (member.role_id === 'role04') {
            console.log('❌ Cannot interact with Owner');
            return;
        }
        
        console.log('✅ Showing context menu');
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            member,
        });
    };

    const handleRoleChange = async (newRoleId: string) => {
        if (!contextMenu) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${contextMenu.member.user_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRoleId),
                }
            );

            if (response.ok) {
                console.log('✅ Rôle mis à jour !');
                onMemberUpdate(); // Rafraîchir la liste des membres
                setContextMenu(null);
            } else {
                console.error('❌ Erreur mise à jour rôle');
                alert('Erreur lors de la mise à jour du rôle');
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur réseau');
        }
    };

    const handleKick = async () => {
        if (!contextMenu) return;
        if (typeof window === 'undefined') return; // Vérification SSR

        // Confirmation
        if (!confirm(`Êtes-vous sûr de vouloir expulser ${contextMenu.member.username} ?`)) {
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        const kickerUserId = sessionStorage.getItem('user_id');

        if (!kickerUserId) {
            alert('Erreur: utilisateur non identifié');
            return;
        }

        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${contextMenu.member.user_id}/kick`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kicker_user_id: kickerUserId }),
                }
            );

            if (response.ok) {
                console.log('✅ Membre expulsé !');
                onMemberUpdate(); // Rafraîchir la liste des membres
                setContextMenu(null);
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur expulsion:', errorText);
                alert(`Erreur lors de l'expulsion: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('Erreur réseau');
        }
    };
    return (
        <aside className="w-60 border-l-2 border-yellow-400/30 bg-black/60">
            <div className="p-4 border-b-2 border-yellow-400/30">
                <h2 className="text-yellow-400 font-bold uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                    MEMBRES ({members.length})
                </h2>
            </div>
            <div className="overflow-y-auto scrollbar-thin p-4 space-y-3">
                {members.length === 0 ? (
                    <div className="text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                        Aucun membre
                    </div>
                ) : (
                    members.map((member) => {
                        const isOnline = onlineMembers.has(member.user_id);
                        const couleur = getRoleColor(member.role_id);

                        return (
                            <div
                                key={member.user_id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-yellow-400/5 transition-all cursor-pointer"
                                onContextMenu={(e) => handleContextMenu(e, member)}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center"
                                        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
                                        <span className="text-yellow-400 font-bold" style={{ fontFamily: 'monospace', color: couleur }}>
                                            {member.username[0].toUpperCase()}
                                        </span>
                                    </div>
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-300 text-sm font-medium truncate" style={{ fontFamily: 'monospace', color: couleur }}>
                                        {member.username}
                                    </div>
                                    <div className="text-gray-600 text-xs" style={{ fontFamily: 'monospace', color: couleur }}>
                                        {member.role_name}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

            {/* Menu contextuel */}
            {contextMenu && (
                <>
                    {/* Overlay pour fermer le menu */}
                    <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setContextMenu(null)}
                    />
                    
                    {/* Menu */}
                    <div
                        className="fixed z-50 backdrop-blur-sm min-w-[200px]"
                        style={{
                            left: contextMenu.x,
                            top: contextMenu.y,
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '2px solid #FFD700',
                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 py-2 border-b border-yellow-600">
                            <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                                {contextMenu.member.username}
                            </p>
                        </div>

                        {/* Liste des rôles */}
                        {getAvailableRoles(getCurrentUserRole()).length > 0 && (
                            <div className="py-2">
                                <p className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                    Assigner un rôle
                                </p>
                                {getAvailableRoles(getCurrentUserRole()).map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleChange(role.id)}
                                        className="w-full px-4 py-2 text-left hover:bg-yellow-900/20 transition-colors flex items-center gap-2"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        {/* Pastille de couleur */}
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: role.color }}
                                        />
                                        <span className="text-sm" style={{ color: role.color }}>
                                            {role.name}
                                        </span>
                                        {/* Checkmark si c'est le rôle actuel */}
                                        {contextMenu.member.role_id === role.id && (
                                            <span className="ml-auto text-yellow-400">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Actions supplémentaires */}
                        {canKickMember(contextMenu.member) && (
                            <>
                                {getAvailableRoles(getCurrentUserRole()).length > 0 && (
                                    <div className="h-px bg-yellow-600 my-1" />
                                )}
                                <div className="py-2">
                                    <p className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                        Actions
                                    </p>
                                    <button
                                        onClick={handleKick}
                                        className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        <span className="text-sm text-red-400">
                                            👢 Expulser
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
            </div>
        </aside>
    );
}
