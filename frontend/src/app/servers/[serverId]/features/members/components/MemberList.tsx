"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";
import type { Member } from "../../../types";
import { useMemberPermissions } from "../hooks/useMemberPermissions";
import { useBanState } from "../hooks/useBanState";
import { useMemberActions } from "../hooks/useMemberActions";
import MemberItem from "./MemberItem";
import BanModal from "./BanModal";
import MemberContextMenu from "./MemberContextMenu";

type MemberListProps = {
    members: Member[];
    onlineMembers: Set<string>;
    serverId: string;
    onMemberUpdate: () => void;
};

export default function MemberList({ members, onlineMembers, serverId, onMemberUpdate }: MemberListProps) {
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        member: Member;
    } | null>(null);
    const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());

    // Custom hooks
    const permissions = useMemberPermissions(members);
    const banState = useBanState();
    const actions = useMemberActions({ serverId, onMemberUpdate });

    // Mettre à jour la liste des membres bannis
    useEffect(() => {
        const bannedUserIds = members
            .filter(member => member.role_id === 'role01')
            .map(member => member.user_id);
        setBannedUsers(new Set(bannedUserIds));
    }, [members]);

    // Handlers
    const handleContextMenu = (e: React.MouseEvent, member: Member) => {
        e.preventDefault();
        
        if (!permissions.canShowContextMenu(member)) {
            return;
        }
        
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            member,
        });
    };

    const handleRoleChange = async (newRoleId: string) => {
        if (!contextMenu) return;
        
        const success = await actions.handleRoleChange(contextMenu.member, newRoleId);
        if (success) {
            setContextMenu(null);
        }
    };

    const handleKick = async () => {
        if (!contextMenu) return;
        
        const success = await actions.handleKick(contextMenu.member);
        if (success) {
            setContextMenu(null);
        }
    };

    const handleBan = () => {
        if (!contextMenu) return;
        
        banState.openBanModal(contextMenu.member, false);
        setContextMenu(null);
    };

    const handleEditBan = async () => {
        if (!contextMenu) return;
        
        const banInfo = await actions.fetchBanInfo(contextMenu.member);
        if (banInfo) {
            banState.setBanReason(banInfo.reason);
            banState.setBanDuration(
                banInfo.months,
                banInfo.days,
                banInfo.hours,
                banInfo.minutes,
                banInfo.seconds
            );
            banState.openBanModal(contextMenu.member, true);
            setContextMenu(null);
        }
    };

    const handleDeban = async () => {
        if (!contextMenu) return;
        
        const success = await actions.handleDeban(contextMenu.member);
        if (success) {
            setBannedUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(contextMenu.member.user_id);
                return newSet;
            });
            setContextMenu(null);
        }
    };

    const handleBanSubmit = async () => {
        if (!banState.banTarget) return;
        
        const success = await actions.submitBan(
            banState.banTarget,
            banState.banReason,
            banState.banMonths,
            banState.banDays,
            banState.banHours,
            banState.banMinutes,
            banState.banSeconds,
            banState.isPermanentBan,
            banState.isEditMode
        );
        
        if (success) {
            if (!banState.isEditMode) {
                setBannedUsers(prev => new Set(prev).add(banState.banTarget!.user_id));
            }
            banState.closeBanModal();
        }
    };

    return (
        <aside className="w-60 border-l-2 border-yellow-400/30 bg-black/60">
            <div className="p-4 border-b-2 border-yellow-400/30">
                <h2 className="text-yellow-400 font-bold uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                    {t.member.members} {t.member.count.replace('{count}', members.length.toString())}
                </h2>
            </div>
            <div className="overflow-y-auto scrollbar-thin p-4 space-y-3">
                {members.length === 0 ? (
                    <div className="text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                        {t.member.noMembers}
                    </div>
                ) : (
                    members.map((member) => (
                        <MemberItem
                            key={member.user_id}
                            member={member}
                            isOnline={onlineMembers.has(member.user_id)}
                            onContextMenu={handleContextMenu}
                        />
                    ))
                )}
            </div>

            {/* Modal de bannissement */}
            {banState.showBanModal && banState.banTarget && (
                <BanModal
                    banTarget={banState.banTarget}
                    isEditMode={banState.isEditMode}
                    banReason={banState.banReason}
                    setBanReason={banState.setBanReason}
                    isPermanentBan={banState.isPermanentBan}
                    setIsPermanentBan={banState.setIsPermanentBan}
                    banMonths={banState.banMonths}
                    setBanMonths={banState.setBanMonths}
                    banDays={banState.banDays}
                    setBanDays={banState.setBanDays}
                    banHours={banState.banHours}
                    setBanHours={banState.setBanHours}
                    banMinutes={banState.banMinutes}
                    setBanMinutes={banState.setBanMinutes}
                    banSeconds={banState.banSeconds}
                    setBanSeconds={banState.setBanSeconds}
                    onSubmit={handleBanSubmit}
                    onClose={banState.closeBanModal}
                />
            )}

            {/* Menu contextuel */}
            {contextMenu && (
                <MemberContextMenu
                    contextMenu={contextMenu}
                    availableRoles={permissions.getAvailableRoles(permissions.getCurrentUserRole())}
                    canKick={permissions.canKickMember(contextMenu.member)}
                    canBan={permissions.canBanMember(contextMenu.member)}
                    canManageBan={permissions.canManageBan(contextMenu.member)}
                    isBanned={bannedUsers.has(contextMenu.member.user_id)}
                    onClose={() => setContextMenu(null)}
                    onRoleChange={handleRoleChange}
                    onKick={handleKick}
                    onBan={handleBan}
                    onEditBan={handleEditBan}
                    onDeban={handleDeban}
                />
            )}
        </aside>
    );
}
