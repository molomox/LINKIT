import type { Member } from "../../../types";
import { getRoleColor } from "@/utils/roleColors";

interface MemberItemProps {
    member: Member;
    isOnline: boolean;
    onContextMenu: (e: React.MouseEvent, member: Member) => void;
}

export default function MemberItem({ member, isOnline, onContextMenu }: MemberItemProps) {
    const couleur = getRoleColor(member.role_id);

    return (
        <div
            className="flex items-center gap-3 p-2 rounded hover:bg-yellow-400/5 transition-all cursor-pointer"
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
                            BANNI
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
        </div>
    );
}
