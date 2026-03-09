"use client";
import type { Member } from "../types";

type MemberListProps = {
    members: Member[];
    onlineMembers: Set<string>;
};

export default function MemberList({ members, onlineMembers }: MemberListProps) {
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

                        return (
                            <div
                                key={member.user_id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-yellow-400/5 transition-all"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center"
                                        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
                                        <span className="text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                                            {member.username[0].toUpperCase()}
                                        </span>
                                    </div>
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-300 text-sm font-medium truncate" style={{ fontFamily: 'monospace' }}>
                                        {member.username}
                                    </div>
                                    <div className="text-gray-600 text-xs" style={{ fontFamily: 'monospace' }}>
                                        {member.role_name}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
