import { useTranslation } from "@/i18n";
import type { Member } from "../../../types";
import { getRoleColor } from "@/utils/roleColors";

interface MemberItemProps {
    member: Member;
    isOnline: boolean;
    onContextMenu: (e: React.MouseEvent, member: Member) => void;
    onStartPrivateMessage: (member: Member) => void;
}

export default function MemberItem({ member, isOnline, onContextMenu, onStartPrivateMessage }: MemberItemProps) {
    const { t } = useTranslation();
    const couleur = getRoleColor(member.role_id);

    return (
        <div
            className="group flex items-center gap-3 p-2 rounded hover:bg-yellow-400/5 transition-all cursor-pointer"
            onContextMenu={(e) => onContextMenu(e, member)}
        >
            <div className="relative">
                <div 
                    className="w-10 h-10 bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center"
                    style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}
                >
                    <span 
                        className="text-yellow-400 font-bold" 
                        style={{ fontFamily: 'monospace', color: couleur }}
                    >
                        {member.username[0].toUpperCase()}
                    </span>
                </div>
                {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div 
                        className="text-gray-300 text-sm font-medium truncate" 
                        style={{ fontFamily: 'monospace', color: couleur }}
                    >
                        {member.username}
                    </div>
                    {member.role_id === 'role01' && (
                        <span 
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-red-900/50 text-red-400 border border-red-500 rounded uppercase tracking-wider"
                            style={{ fontFamily: 'monospace' }}
                        >
                            {t.role.banned}
                        </span>
                    )}
                </div>
                <div 
                    className="text-gray-600 text-xs" 
                    style={{ fontFamily: 'monospace', color: couleur }}
                >
                    {member.role_name}
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onStartPrivateMessage(member);
                }}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/10 transition-all"
                style={{ fontFamily: 'monospace' }}
                title="Message prive"
            >
                MP
            </button>
        </div>
    );
}
