"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Server, Channel } from "../../../types";
import type { WebSocketStatus } from "@/hooks/useWebSocket";

type DmHeaderNotification = {
    id: string;
    channel_id: string;
    server_id: string;
    from_user_id: string;
    from_username: string;
    preview: string;
    is_gif: boolean;
};

type ServerHeaderProps = {
    server: Server | null;
    selectedChannel: Channel | null;
    wsStatus: WebSocketStatus;
    copied: boolean;
    isOwner: boolean;
    canLeave: boolean;
    dmNotifications: DmHeaderNotification[];
    unreadDmCount: number;
    isDmNotifOpen: boolean;
    onCopyInvite: () => void;
    onShowLeaveModal: () => void;
    onShowDeleteModal: () => void;
    onToggleDmNotifications: () => void;
    onCloseDmNotifications: () => void;
    onOpenDmFromNotification: (notif: DmHeaderNotification) => void;
};

export default function ServerHeader({
    server,
    selectedChannel,
    wsStatus,
    copied,
    isOwner,
    canLeave,
    dmNotifications,
    unreadDmCount,
    isDmNotifOpen,
    onCopyInvite,
    onShowLeaveModal,
    onShowDeleteModal,
    onToggleDmNotifications,
    onCloseDmNotifications,
    onOpenDmFromNotification,
}: ServerHeaderProps) {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <header className="relative z-40 border-b-2 border-yellow-400/30 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/auth/me')}
                    className="px-3 py-1 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                    textShadow: "0 0 2px #000000, 0 0 5px yellow, 0 0 1px yellow, 0 0 10px yellow"
                     }}
                >
                    {t.nav.back}
                </button>
                <div>
                    <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        {server?.name || t.server.defaultName}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-yellow-400/70 text-sm" style={{ fontFamily: 'monospace' }}>
                    {selectedChannel ? `# ${selectedChannel.name}` : ""}
                </div>
                <div className="relative">
                    <button
                        onClick={onToggleDmNotifications}
                        className="px-3 py-1 border-2 border-cyan-400/60 text-cyan-300 font-bold uppercase text-xs hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-2"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                        textShadow: "0 0 2px #000000, 0 0 5px cyan, 0 0 1px cyan, 0 0 10px cyan"
                         }}
                    >
                        <span>DM</span>
                        <span className="text-[10px] opacity-80">
                            {dmNotifications[0] ? dmNotifications[0].from_username : "-"}
                        </span>
                    </button>
                    {unreadDmCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border border-black">
                            {unreadDmCount > 9 ? "9+" : unreadDmCount}
                        </span>
                    )}

                    {isDmNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 border-2 border-cyan-400/60 bg-black/95 z-[70] pointer-events-auto">
                            <div className="px-3 py-2 border-b border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                                Notifications DM
                            </div>
                            {dmNotifications.length === 0 ? (
                                <div className="px-3 py-3 text-gray-500 text-xs" style={{ fontFamily: 'monospace' }}>
                                    Aucune notification.
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {dmNotifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => {
                                                onCloseDmNotifications();
                                                onOpenDmFromNotification(notif);
                                            }}
                                            className="w-full text-left px-3 py-3 border-b border-cyan-400/20 hover:bg-cyan-400/10 transition-colors"
                                            style={{ fontFamily: 'monospace' }}
                                        >
                                            <div className="text-cyan-300 text-xs font-bold">{notif.from_username}</div>
                                            <div className="text-gray-300 text-xs truncate">{notif.preview}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button
                    onClick={onCopyInvite}
                    className="px-3 py-1 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                    textShadow: "0 0 2px #000000, 0 0 5px yellow, 0 0 1px yellow, 0 0 10px yellow"
                     }}
                    title={t.server.copyInviteTooltip}
                >
                    {copied ? t.server.inviteCopied : t.server.copyInvite}
                </button>

                {/* Bouton Quitter (pour membres et admins) */}
                {canLeave && (
                    <button
                        onClick={onShowLeaveModal}
                        className="px-3 py-1 border-2 border-orange-400/50 text-orange-400 font-bold uppercase text-xs hover:bg-orange-400 hover:text-black transition-all"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                        textShadow: "0 0 2px #000000, 0 0 5px orange, 0 0 1px orange, 0 0 10px orange"
                        }}
                        title={t.server.leaveTooltip}
                    >
                        {t.server.quitButton}
                    </button>
                )}

                {/* Bouton Supprimer (pour owner uniquement) */}
                {isOwner && (
                    <button
                        onClick={onShowDeleteModal}
                        className="px-3 py-1 border-2 border-red-400/50 text-red-400 font-bold uppercase text-xs hover:bg-red-400 hover:text-black transition-all"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                        textShadow: "0 0 2px #000000, 0 0 5px red, 0 0 1px red, 0 0 10px red"
                         }}
                        title={t.server.deleteTooltip}
                    >
                        {t.server.deleteButtonShort}
                    </button>
                    
                )}
                <LanguageSwitcher />
            </div>
        </header>
    );
}
