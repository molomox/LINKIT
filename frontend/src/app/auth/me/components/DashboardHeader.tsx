"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { DmRealtimeNotification } from "../types";

type DashboardHeaderProps = {
    t: any;
    dmNotifications: DmRealtimeNotification[];
    unreadDmCount: number;
    isNotifOpen: boolean;
    isSupported: boolean;
    permission: NotificationPermission;
    enabled: boolean;
    onToggleNotifications: () => void;
    onCloseNotifications: () => void;
    onOpenDm: (notif: DmRealtimeNotification) => void;
    onCreateServer: () => void;
    onOpenJoinModal: () => void;
    onLogout: () => void;
    onToggleEnabled: () => void;
    onRequestPermission: () => Promise<NotificationPermission>;
    onRefreshPermission: () => void;
    onTestNotification: () => void;
};

export default function DashboardHeader({
    t,
    dmNotifications,
    unreadDmCount,
    isNotifOpen,
    isSupported,
    permission,
    enabled,
    onToggleNotifications,
    onCloseNotifications,
    onOpenDm,
    onCreateServer,
    onOpenJoinModal,
    onLogout,
    onToggleEnabled,
    onRequestPermission,
    onRefreshPermission,
    onTestNotification,
}: DashboardHeaderProps) {
    return (
        <header className="relative z-40 border-b-2 border-yellow-400/30 bg-black/80 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-yellow-400"></div>
                    <h1 className="text-3xl font-black text-yellow-400 tracking-tight uppercase" style={{ fontFamily: "monospace" }}>
                        L!NKYT
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={onToggleNotifications}
                            className="px-4 py-2 border-2 border-cyan-400 text-cyan-300 font-bold uppercase text-xs tracking-wider hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-2"
                            style={{ fontFamily: "monospace", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
                            textShadow: "0 0 2px #000000, 0 0 5px #00FFFF, 0 0 1px #00FFFF, 0 0 10px #00FFFF"
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

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 border-2 border-cyan-400/60 bg-black/95 z-[70] pointer-events-auto">
                                <div className="px-3 py-2 border-b border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase" style={{ fontFamily: "monospace" }}>
                                    Notifications DM
                                </div>
                                {dmNotifications.length === 0 ? (
                                    <div className="px-3 py-3 text-gray-500 text-xs" style={{ fontFamily: "monospace" }}>
                                        Aucune notification.
                                    </div>
                                ) : (
                                    <div className="max-h-72 overflow-y-auto">
                                        {dmNotifications.map((notif) => (
                                            <button
                                                key={notif.id}
                                                onClick={() => {
                                                    onCloseNotifications();
                                                    onOpenDm(notif);
                                                }}
                                                className="w-full text-left px-3 py-3 border-b border-cyan-400/20 hover:bg-cyan-400/10 transition-colors"
                                                style={{ fontFamily: "monospace" }}
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
                    <div className="flex items-center gap-3">
                    <div className="relative">

                        {isSupported && (
                            <button
                                onClick={async () => {
                                    if (permission === "granted") {
                                        onToggleEnabled();
                                        return;
                                    }
                                    await onRequestPermission();
                                    onRefreshPermission();
                                }}
                                className={`œ w-full px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition-all ${
                                    permission === "granted" && enabled
                                        ? "border-green-400 text-green-400 bg-green-400/10 hover:bg-green-400 hover:text-black cursor-pointer"
                                        : permission === "granted" && !enabled
                                            ? "border-red-400 text-red-400 bg-red-400/10 cursor-pointer"
                                            : permission === "denied"
                                                ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-black cursor-pointer"
                                                : "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black cursor-pointer"
                                }`}
                                style={{ fontFamily: "monospace", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {permission === "granted" && enabled
                                    ? "Notifications activées"
                                    : permission === "granted" && !enabled
                                        ? "Notifications désactivées"
                                        : permission === "denied"
                                            ? "❌ Notifications bloquées"
                                            : "🔔 Activer les notifications"}
                            </button>
                        )}
                        </div>
                    </div>

                    <button
                        onClick={onCreateServer}
                        className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 font-bold uppercase text-xs tracking-wider hover:bg-yellow-400 hover:text-black transition-all"
                        style={{ fontFamily: "monospace", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
                        textShadow: "0 0 2px #000000, 0 0 5px yellow, 0 0 1px yellow, 0 0 10px yellow"
                         }}
                    >
                        {t.server.createButton}
                    </button>
                    <button
                        onClick={onOpenJoinModal}
                        className="px-4 py-2 border-2 border-green-400 text-green-400 font-bold uppercase text-xs tracking-wider hover:bg-green-400 hover:text-black transition-all"
                        style={{ fontFamily: "monospace", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
                            textShadow: "0 0 2px #000000, 0 0 5px green, 0 0 1px green, 0 0 10px green"
                         }}
                    >
                        {t.server.joinButton}
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 border-2 border-red-500 text-red-500 font-bold uppercase text-xs tracking-wider hover:bg-red-500 hover:text-black transition-all"
                        style={{ fontFamily: "monospace", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
                        textShadow: "0 0 2px #000000, 0 0 5px red, 0 0 1px red, 0 0 10px red"    
                         }}
                    >
                        {t.auth.logoutButton}
                    </button>
                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    );
}
