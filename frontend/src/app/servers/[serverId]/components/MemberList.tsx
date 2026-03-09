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
        { id: 'role04', name: 'Owner', color: '#ff0000' },
    ];

    const handleContextMenu = (e: React.MouseEvent, member: Member) => {
        e.preventDefault();
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
                        <div className="py-2">
                            <p className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                Assigner un rôle
                            </p>
                            {roleOptions.map((role) => (
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
                    </div>
                </>
            )}
            </div>
        </aside>
    );
}
