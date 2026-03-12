"use client";
import { useState, useEffect } from "react";
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

    const [showBanModal, setShowBanModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // Pour différencier création vs modification
    const [banTarget, setBanTarget] = useState<Member | null>(null);
    const [banReason, setBanReason] = useState("");
    const [banMonths, setBanMonths] = useState(0);
    const [banDays, setBanDays] = useState(0);
    const [banHours, setBanHours] = useState(0);
    const [banMinutes, setBanMinutes] = useState(0);
    const [banSeconds, setBanSeconds] = useState(0);
    const [isPermanentBan, setIsPermanentBan] = useState(false);
    const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set()); // Liste des utilisateurs bannis
    const roleOptions = [
        { id: 'role01', name: 'Ban', color: '#6d0101' },
        { id: 'role02', name: 'Membre', color: '#808080' },
        { id: 'role03', name: 'Admin', color: '#FFD700' },
    ];

    // Mettre à jour la liste des membres bannis quand la liste des membres change
    useEffect(() => {
        const bannedUserIds = members
            .filter(member => member.role_id === 'role01')
            .map(member => member.user_id);
        setBannedUsers(new Set(bannedUserIds));
    }, [members]);

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
            console.log('🔍 Admin can kick?', canKick, '(target role:', targetMember.role_id, ')');
            return canKick;
        }
        
        // Membre et Ban ne peuvent pas kick
        console.log('❌ Current role cannot kick');
        return false;
    };

    const canBanMember = (targetMember: Member): boolean => {
        const currentUserRoleId = getCurrentUserRole();

        //Owner can't be banned
        if (targetMember.role_id === "role04") {
            return false;
        }

        // Owner can ban everyone (except himself)
        if (currentUserRoleId === "role04") {
            return true;
        }

        //Admin can ban members and bans, but not admins or owner
        if (currentUserRoleId === "role03") {
            return targetMember.role_id === "role01" || targetMember.role_id === "role02";
        }
        return false;
    };

    // Vérifier si l'utilisateur peut gérer les bans (éditer/révoquer)
    const canManageBan = (targetMember: Member): boolean => {
        // Même logique que canBanMember
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

    // Vérifier si un utilisateur est actuellement banni
    const isBanned = (userId: string): boolean => {
        return bannedUsers.has(userId);
    };

    const handleContextMenu = (e: React.MouseEvent, member: Member) => {
        e.preventDefault();
        
        console.log('🖱️ Context menu opened for:', member.username);
        
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
        console.log('🚀 handleKick called');
        
        if (!contextMenu) {
            console.log('❌ No contextMenu');
            return;
        }
        
        if (typeof window === 'undefined') {
            console.log('❌ SSR check failed');
            return;
        }

        console.log('👤 Kicking user:', contextMenu.member.username);

        // Confirmation
        const confirmed = confirm(`Êtes-vous sûr de vouloir expulser ${contextMenu.member.username} ?`);
        console.log('✅ Confirmation:', confirmed);
        
        if (!confirmed) {
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        const kickerUserId = sessionStorage.getItem('user_id');

        console.log('🔑 Kicker user ID:', kickerUserId);
        console.log('🎯 Target user ID:', contextMenu.member.user_id);

        if (!kickerUserId) {
            alert('Erreur: utilisateur non identifié');
            return;
        }

        const url = `${apiBase}/servers/${serverId}/members/${contextMenu.member.user_id}/kick`;
        console.log('📡 Sending DELETE request to:', url);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kicker_user_id: kickerUserId }),
            });

            console.log('📥 Response status:', response.status);

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
            alert('Erreur réseau: ' + error);
        }
    };
    const handleBan = () => {
        if(!contextMenu) return;
        setIsEditMode(false);
        setBanTarget(contextMenu.member);
        setBanReason("");
        setBanMonths(0);
        setBanDays(0);
        setBanHours(0);
        setBanMinutes(0);
        setBanSeconds(0);
        setIsPermanentBan(false);
        setShowBanModal(true);
        setContextMenu(null);
    };

    const handleEditBan = async () => {
        if (!contextMenu) return;
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        
        try {
            // Récupérer les infos du ban
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${contextMenu.member.user_id}/get_ban`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.ok) {
                const banInfo = await response.json();
                
                // Calculer la durée depuis maintenant jusqu'à l'expiration
                const now = new Date();
                const expiredAt = new Date(banInfo.expired_at);
                const diffMs = expiredAt.getTime() - now.getTime();
                
                if (diffMs > 0) {
                    const diffSeconds = Math.floor(diffMs / 1000);
                    const months = Math.floor(diffSeconds / (30 * 24 * 60 * 60));
                    const days = Math.floor((diffSeconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60));
                    const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
                    const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
                    const seconds = diffSeconds % 60;
                    
                    setBanMonths(months);
                    setBanDays(days);
                    setBanHours(hours);
                    setBanMinutes(minutes);
                    setBanSeconds(seconds);
                }
                
                setBanReason(banInfo.reason || "");
                setIsEditMode(true);
                setBanTarget(contextMenu.member);
                setShowBanModal(true);
                setContextMenu(null);
            } else {
                alert("Impossible de récupérer les informations du ban");
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur réseau');
        }
    };

    const handleDeban = async () => {
        if (!contextMenu) return;
        if (typeof window === 'undefined') return;

        // Confirmation
        if (!confirm(`Êtes-vous sûr de vouloir révoquer le bannissement de ${contextMenu.member.username} ?`)) {
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${contextMenu.member.user_id}/deban`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            if (response.ok) {
                console.log('✅ Ban révoqué !');
                alert(`Le ban de ${contextMenu.member.username} a été révoqué.`);
                setBannedUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(contextMenu.member.user_id);
                    return newSet;
                });
                onMemberUpdate(); // Rafraîchir la liste des membres
                setContextMenu(null);
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur révocation ban:', errorText);
                alert(`Erreur lors de la révocation: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('Erreur réseau');
        }
    };

    const handleBanSubmit = async () => {
        if (!banTarget) return;
        if (!banReason.trim()) {
            alert("Veuillez fournir une raison pour le bannissement.");
            return;
        }
        if(typeof window === 'undefined') return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        const bannerUserId = sessionStorage.getItem('user_id');

        if (!bannerUserId) {
            alert("Erreur: utilisateur non identifié");
            return;
        }

        // Calculer la date d'expiration
        let expiredAt = new Date();
        
        if (isPermanentBan) {
            // Ban permanent : date dans 100 ans
            expiredAt.setFullYear(expiredAt.getFullYear() + 100);
        } else {
            // Vérifier qu'au moins une durée est spécifiée
            const totalDuration = banMonths + banDays + banHours + banMinutes + banSeconds;
            if (totalDuration === 0) {
                alert("Veuillez spécifier une durée de bannissement ou cocher 'Bannissement permanent'.");
                return;
            }
            
            // Calculer la date d'expiration selon les durées spécifiées
            expiredAt.setMonth(expiredAt.getMonth() + banMonths);
            expiredAt.setDate(expiredAt.getDate() + banDays);
            expiredAt.setHours(expiredAt.getHours() + banHours);
            expiredAt.setMinutes(expiredAt.getMinutes() + banMinutes);
            expiredAt.setSeconds(expiredAt.getSeconds() + banSeconds);
        }

        try {
            let response;
            
            if (isEditMode) {
                // Mode modification : utiliser PUT
                response = await fetch(
                    `${apiBase}/servers/${serverId}/members/${banTarget.user_id}/update_ban`,
                    {
                        method: "PUT",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reason: banReason,
                            expired_at: expiredAt.toISOString(),
                        }),
                    }
                );
            } else {
                // Mode création : utiliser POST
                response = await fetch(
                    `${apiBase}/servers/${serverId}/members/${banTarget.user_id}/ban`,
                    {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            banner_user_id: bannerUserId,
                            reason: banReason,
                            expired_at: expiredAt.toISOString(),
                        }),
                    }
                );
            }

            if (response.ok) {
                console.log(isEditMode ? '✅ Ban modifié !' : '✅ Membre banni !');
                alert(isEditMode 
                    ? `Le ban de ${banTarget.username} a été modifié.` 
                    : `${banTarget.username} a été banni du serveur.`
                );
                
                if (!isEditMode) {
                    setBannedUsers(prev => new Set(prev).add(banTarget.user_id));
                    onMemberUpdate(); // Rafraîchir la liste des membres
                }
                
                setShowBanModal(false);
                setIsEditMode(false);
                setBanTarget(null);
                setBanReason("");
                setBanMonths(0);
                setBanDays(0);
                setBanHours(0);
                setBanMinutes(0);
                setBanSeconds(0);
                setIsPermanentBan(false);
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur bannissement:', errorText);
                alert(`Erreur lors du bannissement: ${errorText}`);
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
                                    <div className="flex items-center gap-2">
                                        <div className="text-gray-300 text-sm font-medium truncate" style={{ fontFamily: 'monospace', color: couleur }}>
                                            {member.username}
                                        </div>
                                        {member.role_id === 'role01' && (
                                            <span 
                                                className="px-1.5 py-0.5 text-[9px] font-bold bg-red-900/50 text-red-400 border border-red-500 rounded uppercase tracking-wider"
                                                style={{ fontFamily: 'monospace' }}
                                            >
                                                BANNI
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-xs" style={{ fontFamily: 'monospace', color: couleur }}>
                                        {member.role_name}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

            {/* Modal de bannissement */}
            {showBanModal && banTarget && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 z-50 bg-black/80"
                        onClick={() => {
                            setShowBanModal(false);
                            setBanTarget(null);
                            setBanReason("");
                            setBanMonths(0);
                            setBanDays(0);
                            setBanHours(0);
                            setBanMinutes(0);
                            setBanSeconds(0);
                            setIsPermanentBan(false);
                        }}
                    />
                    
                    {/* Modal */}
                    <div
                        className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] backdrop-blur-sm"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '2px solid #DC2626',
                            boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-red-600">
                            <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                🔨 BANNIR {banTarget.username}
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Raison */}
                            <div>
                                <label className="block text-yellow-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                                    Raison du bannissement *
                                </label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Ex: Spam, comportement toxique, violation des règles..."
                                    className="w-full px-3 py-2 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 resize-none"
                                    style={{ fontFamily: 'monospace' }}
                                    rows={4}
                                />
                            </div>

                            {/* Case à cocher pour ban permanent */}
                            <div className="flex items-center gap-3 p-3 bg-red-900/20 border-2 border-red-600 rounded">
                                <input
                                    type="checkbox"
                                    id="permanentBan"
                                    checked={isPermanentBan}
                                    onChange={(e) => setIsPermanentBan(e.target.checked)}
                                    className="w-5 h-5 cursor-pointer"
                                />
                                <label 
                                    htmlFor="permanentBan" 
                                    className="text-red-400 font-bold cursor-pointer select-none"
                                    style={{ fontFamily: 'monospace' }}
                                >
                                    ⚠️ BANNISSEMENT PERMANENT
                                </label>
                            </div>

                            {/* Durée */}
                            <div>
                                <label className="block text-yellow-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                                    Durée du bannissement {!isPermanentBan && '*'}
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {/* Mois */}
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Mois</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="12"
                                            value={banMonths}
                                            onChange={(e) => setBanMonths(parseInt(e.target.value) || 0)}
                                            disabled={isPermanentBan}
                                            className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    {/* Jours */}
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Jours</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="365"
                                            value={banDays}
                                            onChange={(e) => setBanDays(parseInt(e.target.value) || 0)}
                                            disabled={isPermanentBan}
                                            className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    {/* Heures */}
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Heures</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="24"
                                            value={banHours}
                                            onChange={(e) => setBanHours(parseInt(e.target.value) || 0)}
                                            disabled={isPermanentBan}
                                            className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    {/* Minutes */}
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Min</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={banMinutes}
                                            onChange={(e) => setBanMinutes(parseInt(e.target.value) || 0)}
                                            disabled={isPermanentBan}
                                            className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                    {/* Secondes */}
                                    <div>
                                        <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Sec</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={banSeconds}
                                            onChange={(e) => setBanSeconds(parseInt(e.target.value) || 0)}
                                            disabled={isPermanentBan}
                                            className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                                {!isPermanentBan && (
                                    <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                        💡 Spécifiez au moins une durée pour le bannissement
                                    </p>
                                )}
                                {isPermanentBan && (
                                    <p className="text-red-400 text-xs mt-2 font-bold" style={{ fontFamily: 'monospace' }}>
                                        ⚠️ Le bannissement sera PERMANENT (100 ans)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-red-600 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowBanModal(false);
                                    setIsEditMode(false);
                                    setBanTarget(null);
                                    setBanReason("");
                                    setBanMonths(0);
                                    setBanDays(0);
                                    setBanHours(0);
                                    setBanMinutes(0);
                                    setBanSeconds(0);
                                    setIsPermanentBan(false);
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                style={{ fontFamily: 'monospace' }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleBanSubmit}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-bold"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {isEditMode ? '✏️ MODIFIER' : '🔨 BANNIR'}
                            </button>
                        </div>
                    </div>
                </>
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
                                        onClick={(e) => {
                                            console.log('👢 Kick button clicked');
                                            handleKick();
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        <span className="text-sm text-red-400">
                                            👢 Expulser
                                        </span>
                                    </button>
                                    {canBanMember(contextMenu.member) && !isBanned(contextMenu.member.user_id) && (
                                        <button
                                            onClick={handleBan}
                                            className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                            style={{ fontFamily: 'monospace' }}
                                        >
                                            <span className="text-sm text-red-600">
                                                🔨 Bannir
                                            </span>
                                        </button>
                                    )}
                                    {canManageBan(contextMenu.member) && isBanned(contextMenu.member.user_id) && (
                                        <>
                                            <button
                                                onClick={handleEditBan}
                                                className="w-full px-4 py-2 text-left hover:bg-yellow-900/20 transition-colors flex items-center gap-2"
                                                style={{ fontFamily: 'monospace' }}
                                            >
                                                <span className="text-sm text-yellow-500">
                                                    ✏️ Modifier le ban
                                                </span>
                                            </button>
                                            <button
                                                onClick={handleDeban}
                                                className="w-full px-4 py-2 text-left hover:bg-green-900/20 transition-colors flex items-center gap-2"
                                                style={{ fontFamily: 'monospace' }}
                                            >
                                                <span className="text-sm text-green-500">
                                                    🔨 Révoquer le ban
                                                </span>
                                            </button>
                                        </>
                                    )}
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
