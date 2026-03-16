import type { Member } from "../../../types";
import { buildAuthHeaders } from "@/utils/authHeaders";

interface UseMemberActionsProps {
    serverId: string;
    onMemberUpdate: () => void;
}

interface BanInfo {
    reason: string;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function useMemberActions({ serverId, onMemberUpdate }: UseMemberActionsProps) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const handleRoleChange = async (member: Member, newRoleId: string): Promise<boolean> => {
        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${member.user_id}`,
                {
                    method: 'PUT',
                    headers: buildAuthHeaders(),
                    body: JSON.stringify(newRoleId),
                }
            );

            if (response.ok) {
                console.log('✅ Rôle mis à jour !');
                onMemberUpdate();
                return true;
            } else {
                console.error('❌ Erreur mise à jour rôle');
                alert('Erreur lors de la mise à jour du rôle');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur réseau');
            return false;
        }
    };

    const handleKick = async (member: Member): Promise<boolean> => {
        console.log('🚀 handleKick called');
        
        if (typeof window === 'undefined') {
            console.log('❌ SSR check failed');
            return false;
        }

        console.log('👤 Kicking user:', member.username);

        const confirmed = confirm(`Êtes-vous sûr de vouloir expulser ${member.username} ?`);
        console.log('✅ Confirmation:', confirmed);
        
        if (!confirmed) {
            return false;
        }

        const kickerUserId = sessionStorage.getItem('user_id');
        console.log('🔑 Kicker user ID:', kickerUserId);
        console.log('🎯 Target user ID:', member.user_id);

        if (!kickerUserId) {
            alert('Erreur: utilisateur non identifié');
            return false;
        }

        const url = `${apiBase}/servers/${serverId}/members/${member.user_id}/kick`;
        console.log('📡 Sending DELETE request to:', url);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: buildAuthHeaders(),
                body: JSON.stringify({ kicker_user_id: kickerUserId }),
            });

            console.log('📥 Response status:', response.status);

            if (response.ok) {
                console.log('✅ Membre expulsé !');
                onMemberUpdate();
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur expulsion:', errorText);
                alert(`Erreur lors de l'expulsion: ${errorText}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('Erreur réseau: ' + error);
            return false;
        }
    };

    const fetchBanInfo = async (member: Member): Promise<BanInfo | null> => {
        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${member.user_id}/get_ban`,
                {
                    method: 'GET',
                    headers: buildAuthHeaders(false),
                }
            );

            if (response.ok) {
                const banInfo = await response.json();
                
                // Calculer la durée depuis maintenant jusqu'à l'expiration
                const now = new Date();
                const expiredAt = new Date(banInfo.expired_at);
                const diffMs = expiredAt.getTime() - now.getTime();
                
                let months = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
                
                if (diffMs > 0) {
                    const diffSeconds = Math.floor(diffMs / 1000);
                    months = Math.floor(diffSeconds / (30 * 24 * 60 * 60));
                    days = Math.floor((diffSeconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60));
                    hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
                    minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
                    seconds = diffSeconds % 60;
                }
                
                return {
                    reason: banInfo.reason || "",
                    months,
                    days,
                    hours,
                    minutes,
                    seconds,
                };
            } else {
                alert("Impossible de récupérer les informations du ban");
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur réseau');
            return null;
        }
    };

    const handleDeban = async (member: Member): Promise<boolean> => {
        if (typeof window === 'undefined') return false;

        if (!confirm(`Êtes-vous sûr de vouloir révoquer le bannissement de ${member.username} ?`)) {
            return false;
        }

        try {
            const response = await fetch(
                `${apiBase}/servers/${serverId}/members/${member.user_id}/deban`,
                {
                    method: 'DELETE',
                    headers: buildAuthHeaders(false),
                }
            );

            if (response.ok) {
                console.log('✅ Ban révoqué !');
                alert(`Le ban de ${member.username} a été révoqué.`);
                onMemberUpdate();
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur révocation ban:', errorText);
                alert(`Erreur lors de la révocation: ${errorText}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('Erreur réseau');
            return false;
        }
    };

    const submitBan = async (
        member: Member,
        reason: string,
        months: number,
        days: number,
        hours: number,
        minutes: number,
        seconds: number,
        isPermanent: boolean,
        isEditMode: boolean
    ): Promise<boolean> => {
        if (!reason.trim()) {
            alert("Veuillez fournir une raison pour le bannissement.");
            return false;
        }
        
        if (typeof window === 'undefined') return false;

        const bannerUserId = sessionStorage.getItem('user_id');

        if (!bannerUserId) {
            alert("Erreur: utilisateur non identifié");
            return false;
        }

        let expiredAt = new Date();
        
        if (isPermanent) {
            expiredAt.setFullYear(expiredAt.getFullYear() + 100);
        } else {
            const totalDuration = months + days + hours + minutes + seconds;
            if (totalDuration === 0) {
                alert("Veuillez spécifier une durée de bannissement ou cocher 'Bannissement permanent'.");
                return false;
            }
            
            expiredAt.setMonth(expiredAt.getMonth() + months);
            expiredAt.setDate(expiredAt.getDate() + days);
            expiredAt.setHours(expiredAt.getHours() + hours);
            expiredAt.setMinutes(expiredAt.getMinutes() + minutes);
            expiredAt.setSeconds(expiredAt.getSeconds() + seconds);
        }

        try {
            let response;
            
            if (isEditMode) {
                response = await fetch(
                    `${apiBase}/servers/${serverId}/members/${member.user_id}/update_ban`,
                    {
                        method: "PUT",
                        headers: buildAuthHeaders(),
                        body: JSON.stringify({
                            reason: reason,
                            expired_at: expiredAt.toISOString(),
                        }),
                    }
                );
            } else {
                response = await fetch(
                    `${apiBase}/servers/${serverId}/members/${member.user_id}/ban`,
                    {
                        method: "POST",
                        headers: buildAuthHeaders(),
                        body: JSON.stringify({
                            banner_user_id: bannerUserId,
                            reason: reason,
                            expired_at: expiredAt.toISOString(),
                        }),
                    }
                );
            }

            if (response.ok) {
                console.log(isEditMode ? '✅ Ban modifié !' : '✅ Membre banni !');
                alert(isEditMode 
                    ? `Le ban de ${member.username} a été modifié.` 
                    : `${member.username} a été banni du serveur.`
                );
                
                if (!isEditMode) {
                    onMemberUpdate();
                }
                
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur bannissement:', errorText);
                alert(`Erreur lors du bannissement: ${errorText}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('Erreur réseau');
            return false;
        }
    };

    return {
        handleRoleChange,
        handleKick,
        fetchBanInfo,
        handleDeban,
        submitBan,
    };
}
