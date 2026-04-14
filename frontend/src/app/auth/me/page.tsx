"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RequireAuth from "@/components/RequireAuth";
import { buildAuthHeaders } from "@/utils/authHeaders";
import * as serverActions from "../../servers/[serverId]/utils/serverActions";
import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";

type UserProfile = {
    username: string;
    email: string;
    user_id: string;
    create_at: string;
};

type Server = {
    id: string;
    name: string;
    memberCount: number;
};

type ServerApiResponse = {
    server_id: string;
    name: string;
    password: string;
    create_at: string;
    all_channels: unknown[];
};

type DmConversation = {
    channel_id: string;
    user_id: string;
    username: string;
    server_id: string;
    server_name: string;
};

type DmRealtimeNotification = {
    id: string;
    channel_id: string;
    server_id: string;
    from_user_id: string;
    from_username: string;
    preview: string;
    is_gif: boolean;
};

export default function DashboardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [servers, setServers] = useState<Server[]>([]);
    const [loading, setLoading] = useState(true);
    const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [dmNotifications, setDmNotifications] = useState<DmRealtimeNotification[]>([]);
    const [unreadDmCount, setUnreadDmCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const wsConnectionsRef = useRef<WebSocket[]>([]);
    const notifOpenRef = useRef(false);
    const { isSupported, permission, enabled, requestPermission, refreshPermission, toggleEnabled,  notify } = useDesktopNotifications();

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://linkyt-backend-fqz7hu-60dfe2-46-224-236-78.traefik.me/";
    const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';
    
    const forceLogin = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");
        router.replace("/auth/login");
    };

    useEffect(() => {
        const checkAuth = () => {
            const token = sessionStorage.getItem("token");
            const userId = sessionStorage.getItem("user_id");
            if (!token || !userId) {
                setLoading(true);
                forceLogin();
            }
        };

        // Immediate check on mount.
        checkAuth();

        // Keep page locked even if token is removed during an active session.
        const interval = window.setInterval(checkAuth, 1000);

        return () => {
            window.clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        notifOpenRef.current = isNotifOpen;
    }, [isNotifOpen]);

    useEffect(() => {
        let isMounted = true;

        const loadUserData = async () => {
            try {
                // Récupérer l'user_id du sessionStorage
                const userId = sessionStorage.getItem("user_id");
                const token = sessionStorage.getItem("token");

                if (!userId || !token) {
                    forceLogin();
                    return;
                }

                // Charger les informations utilisateur
                const userRes = await fetch(`${apiBase}/me?user_id=${userId}`, {
                    method: "GET",
                    headers: buildAuthHeaders(),
                });

                if (!isMounted) return;

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser({
                        username: userData.username,
                        email: userData.email,
                        user_id: userData.user_id,
                        create_at: userData.create_at,
                    });
                } else {
                    if (userRes.status === 401 || userRes.status === 403) {
                        forceLogin();
                        return;
                    }
                    throw new Error(`User fetch failed with status ${userRes.status}`);
                }

                // Charger les serveurs
                console.log("🔵 [MOUNT] Chargement des serveurs pour user_id:", userId);
                const serversRes = await fetch(`${apiBase}/servers?user_id=${userId}`, {
                    method: "GET",
                    headers: buildAuthHeaders(),
                });

                if (!isMounted) return;

                console.log("🔵 Status serveurs:", serversRes.status);

                if (serversRes.ok) {
                    const serversData = await serversRes.json();
                    console.log("✅ Serveurs chargés:", serversData);
                    const normalizedServers = serversData.map((server: ServerApiResponse) => ({
                        id: server.server_id,
                        name: server.name,
                        memberCount: 0,
                    }));
                    setServers(normalizedServers);

                    const dmResults = await Promise.allSettled(
                        normalizedServers.map((server: Server) =>
                            serverActions.listDmChannels(server.id, userId, apiBase).then((channels) =>
                                channels.map((dm) => ({
                                    ...dm,
                                    server_name: server.name,
                                })),
                            ),
                        ),
                    );

                    const mergedDms = dmResults
                        .filter((r): r is PromiseFulfilledResult<DmConversation[]> => r.status === "fulfilled")
                        .flatMap((r) => r.value);

                    setDmConversations(mergedDms);
                } else {
                    if (serversRes.status === 401 || serversRes.status === 403) {
                        forceLogin();
                        return;
                    }
                    const errorText = await serversRes.text();
                    console.error("🔴 Erreur chargement serveurs:", errorText);
                    setServers([]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur lors du chargement:", error);
                if (isMounted) {
                    forceLogin();
                    setLoading(false);
                }
            }
        };

        loadUserData();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const username = sessionStorage.getItem("username");
        const token = sessionStorage.getItem("token");

        wsConnectionsRef.current.forEach((socket) => socket.close());
        wsConnectionsRef.current = [];

        if (!userId || !username || !token || servers.length === 0) {
            return;
        }

        const uniqueServerIds = Array.from(new Set(servers.map((s) => s.id)));
        const sockets = uniqueServerIds.map((serverId) => {
            const ws = new WebSocket(`${wsBase}/ws/servers/${serverId}`);

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        type: "identify",
                        user_id: userId,
                        username,
                    }),
                );
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as {
                        type?: string;
                        to_user_id?: string;
                        from_user_id?: string;
                        from_username?: string;
                        preview?: string;
                        is_gif?: boolean;
                        channel_id?: string;
                        server_id?: string;
                    };

                    if (message.type !== "dm_message" || message.to_user_id !== userId) {
                        return;
                    }

                    const notification: DmRealtimeNotification = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        channel_id: message.channel_id || "",
                        server_id: message.server_id || serverId,
                        from_user_id: message.from_user_id || "",
                        from_username: message.from_username || "Utilisateur",
                        preview: message.is_gif ? "a envoye un GIF" : (message.preview || "Nouveau message"),
                        is_gif: !!message.is_gif,
                    };

                    console.log('[DM NOTIF]', notification);
                    notify({
                        title: `DM de ${notification.from_username}`,
                        body: notification.preview,
                        tag: `dm-${notification.channel_id}`,
                    });

                    setDmNotifications((prev) => [notification, ...prev].slice(0, 10));
                    if (!notifOpenRef.current) {
                        setUnreadDmCount((prev) => prev + 1);
                    }
                } catch {
                    // Ignore malformed websocket payloads.
                }
            };

            return ws;
        });

        wsConnectionsRef.current = sockets;

        return () => {
            sockets.forEach((socket) => socket.close());
            wsConnectionsRef.current = [];
        };
    }, [servers, wsBase]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} days ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }
    };

    const handleLogout = () => {
        router.push("/auth/logout");
    };

    const handleCreateServer = () => {
        router.push("/servers/create");
    };

    const toggleNotifications = () => {
        setIsNotifOpen((prev) => {
            const next = !prev;
            if (next) {
                setUnreadDmCount(0);
            }
            return next;
        });
    };

    const handleJoinServer = async () => {
        if (!inviteLink.trim()) return;

        const normalizedInput = inviteLink.trim();
        let inviteCode = normalizedInput;

        try {
            const parsedUrl = new URL(normalizedInput);
            const segments = parsedUrl.pathname.split('/').filter(Boolean);
            inviteCode = segments[segments.length - 1] || "";
        } catch {
            const segments = normalizedInput.split('/').filter(Boolean);
            inviteCode = segments[segments.length - 1] || normalizedInput;
        }

        if (inviteCode) {
            router.push(`/invite/${encodeURIComponent(inviteCode)}`);
        }

        setShowJoinModal(false);
        setInviteLink("");
    };

    if (loading) {
        return (
            <RequireAuth>
                <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
                    <div className="text-center">
                        <div className="text-yellow-400 text-2xl font-black mb-4" style={{ fontFamily: 'monospace' }}>
                            {t.common.loading}
                        </div>
                        <div className="w-64 h-1 bg-gray-800 overflow-hidden">
                            <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '50%' }}></div>
                        </div>
                    </div>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes glitch {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
                        50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
                    }
                `
            }} />

            <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
                {/* Grille cyberpunk en fond */}
                <div className="fixed inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Scanlines */}
                <div className="fixed inset-0 pointer-events-none opacity-5"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #FFD700 2px, #FFD700 4px)',
                    }}
                />

                {/* Header */}
                <header className="relative z-10 border-b-2 border-yellow-400/30 bg-black/80 backdrop-blur-sm">
                    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-yellow-400"></div>
                            <h1 className="text-3xl font-black text-yellow-400 tracking-tight uppercase" style={{ fontFamily: 'monospace' }}>
                                L!NKYT
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={toggleNotifications}
                                    className="px-4 py-2 border-2 border-cyan-400 text-cyan-300 font-bold uppercase text-xs tracking-wider hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-2"
                                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                                >
                                    <span>DM</span>
                                    <span className="text-[10px] opacity-80">
                                        {dmNotifications[0] ? dmNotifications[0].from_username : "-"}
                                    </span>
                                </button>
                                {isSupported && (
                                    <button
                                        onClick={async () => {
                                            if (permission === "granted") {
                                                toggleEnabled();
                                                return;
                                            }
                                            await requestPermission();
                                            refreshPermission();
                                        }}
                                        className={`mt-2 w-full px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition-all ${
                                            permission === "granted" && enabled
                                                ? "border-green-400 text-green-400 bg-green-400/10 hover:bg-green-400 hover:text-black cursor-pointer"
                                                : permission === "granted" && !enabled
                                                    ? "border-green-400 text-green-400 bg-green-400/10 cursor-pointer"
                                                : permission === "denied"
                                                    ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-black cursor-pointer"
                                                    : "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black cursor-pointer"
                                        }`}
                                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
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

                                {isSupported && (
                                    <button
                                        onClick={() => {
                                            if (permission !== "granted" || !enabled) {
                                                return;
                                            }
                                            notify({
                                                title: "Test notification L!nkyt",
                                                body: "Si tu vois ca, les notifications desktop fonctionnent.",
                                                tag: `notif-test-${Date.now()}`,
                                            });
                                        }}
                                        className={`mt-2 w-full px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition-all ${
                                            permission === "granted" && enabled
                                                ? "border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black cursor-pointer"
                                                : "border-gray-600 text-gray-500 cursor-not-allowed"
                                        }`}
                                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                                    >
                                        {permission === "granted" && enabled
                                            ? "🧪 Tester la notification"
                                            : "🧪 Test indisponible (activer les notifications)"}
                                    </button>
                                )}
                                
                                {unreadDmCount > 0 && (
                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border border-black">
                                        {unreadDmCount > 9 ? "9+" : unreadDmCount}
                                    </span>
                                )}

                                {isNotifOpen && (
                                    <div className="absolute right-0 mt-2 w-80 border-2 border-cyan-400/60 bg-black/95 z-30">
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
                                                            setIsNotifOpen(false);
                                                            router.push(`/dm/${notif.channel_id}?serverId=${encodeURIComponent(notif.server_id)}&username=${encodeURIComponent(notif.from_username)}&userId=${encodeURIComponent(notif.from_user_id)}`);
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
                                onClick={handleCreateServer}
                                className="px-4 py-2 border-2 border-yellow-400 text-yellow-400 font-bold uppercase text-xs tracking-wider hover:bg-yellow-400 hover:text-black transition-all"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {t.server.createButton}
                            </button>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="px-4 py-2 border-2 border-green-400 text-green-400 font-bold uppercase text-xs tracking-wider hover:bg-green-400 hover:text-black transition-all"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {t.server.joinButton}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 border-2 border-red-500 text-red-500 font-bold uppercase text-xs tracking-wider hover:bg-red-500 hover:text-black transition-all"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {t.auth.logoutButton}
                            </button>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container mx-auto px-6 py-8">
                    <div className="flex gap-6">
                        {/* Servers Section - Centre */}
                        <div className="flex-1">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-6 bg-yellow-400"></div>
                                    <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                        {t.dashboard.serversTitle}
                                    </h2>
                                </div>
                                <div className="h-px bg-gradient-to-r from-yellow-400 via-yellow-400/50 to-transparent"></div>
                            </div>

                            {servers.length === 0 ? (
                                <div className="border-2 border-gray-700 bg-black/60 p-12 text-center"
                                    style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}
                                >
                                    <div className="text-gray-500 font-bold uppercase text-sm mb-4" style={{ fontFamily: 'monospace' }}>
                                        {t.dashboard.noServers}
                                    </div>
                                    <button
                                        onClick={handleCreateServer}
                                        className="px-6 py-3 border-2 border-yellow-400 text-yellow-400 font-black uppercase hover:bg-yellow-400 hover:text-black transition-all"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        {t.server.createButton}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {servers.map((server) => (
                                        <div
                                            key={server.id}
                                            onClick={() => router.push(`/servers/${server.id}`)}
                                            className="border-2 border-yellow-400/40 bg-black/70 p-6 hover:border-yellow-400 hover:bg-black/90 transition-all cursor-pointer group"
                                            style={{
                                                clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
                                                borderLeft: "4px solid #FFD700"
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center group-hover:bg-yellow-400 transition-all">
                                                    <span className="text-xl font-black text-yellow-400 group-hover:text-black" style={{ fontFamily: 'monospace' }}>
                                                        {server.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
                                            </div>
                                            <h3 className="text-yellow-300 font-bold mb-2 uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                                                {server.name}
                                            </h3>
                                            <div className="text-xs text-gray-500 font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                                                {server.memberCount} {t.member.members}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Server Card */}
                                    <div
                                        onClick={handleCreateServer}
                                        className="border-2 border-dashed border-gray-700 bg-black/40 p-6 hover:border-yellow-400/50 hover:bg-black/60 transition-all cursor-pointer flex items-center justify-center"
                                        style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl text-gray-700 mb-2 font-black">+</div>
                                            <div className="text-xs text-gray-600 font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                                                {t.server.addServer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-6 bg-green-400"></div>
                                    <h3 className="text-xl font-black text-green-400 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                        Messages prives
                                    </h3>
                                </div>

                                {dmConversations.length === 0 ? (
                                    <div className="border border-gray-700/60 bg-black/40 p-4 text-gray-500 text-sm" style={{ fontFamily: 'monospace' }}>
                                        Aucune conversation DM en cours.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {dmConversations.map((dm) => (
                                            <button
                                                key={`${dm.server_id}-${dm.channel_id}`}
                                                onClick={() => {
                                                    const dmUrl = `/dm/${dm.channel_id}?serverId=${encodeURIComponent(dm.server_id)}&username=${encodeURIComponent(dm.username)}&userId=${encodeURIComponent(dm.user_id)}`;
                                                    router.push(dmUrl);
                                                }}
                                                className="w-full text-left border border-green-400/30 bg-black/50 px-4 py-3 hover:bg-green-400/10 transition-all"
                                                style={{ fontFamily: 'monospace' }}
                                            >
                                                <div className="text-green-300 font-bold">@{dm.username}</div>
                                                <div className="text-xs text-gray-500">Server: {dm.server_name}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Card - Droite */}
                        <div className="w-80">
                            <div
                                className="border-2 border-yellow-400 bg-black/85 backdrop-blur-sm sticky top-8"
                                style={{
                                    clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
                                    borderLeft: "4px solid #FFD700",
                                    boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)"
                                }}
                            >
                                {/* Header */}
                                <div className="border-b-2 border-yellow-400/30 p-4 bg-yellow-400/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-yellow-400"></div>
                                        <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                                            {t.dashboard.profile}
                                        </h3>
                                    </div>
                                </div>

                                {/* Profile Content */}
                                <div className="p-6">
                                    {/* Avatar */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-yellow-400 bg-black flex items-center justify-center"
                                                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
                                            >
                                                <span className="text-4xl font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>
                                                    {user?.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 border-2 border-black animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 font-bold uppercase mb-1 tracking-wider" style={{ fontFamily: 'monospace' }}>
                                            {t.auth.username}
                                        </div>
                                        <div className="text-yellow-300 font-black text-lg uppercase tracking-wide" style={{ fontFamily: 'monospace' }}>
                                            {user?.username}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 font-bold uppercase mb-1 tracking-wider" style={{ fontFamily: 'monospace' }}>
                                            {t.auth.email}
                                        </div>
                                        <div className="text-yellow-300/80 font-bold text-sm break-all" style={{ fontFamily: 'monospace' }}>
                                            {user?.email}
                                        </div>
                                    </div>


                                    {/* Member Since */}
                                    <div className="mb-6">
                                        <div className="text-xs text-gray-500 font-bold uppercase mb-1 tracking-wider" style={{ fontFamily: 'monospace' }}>
                                            {t.dashboard.memberSince}
                                        </div>
                                        <div className="text-yellow-300/80 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                            {user?.create_at && formatDate(user.create_at)}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-yellow-400/20 mb-6"></div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="border border-yellow-400/30 bg-yellow-400/5 p-3 text-center">
                                            <div className="text-2xl font-black text-yellow-400 mb-1" style={{ fontFamily: 'monospace' }}>
                                                {servers.length}
                                            </div>
                                            <div className="text-xs text-gray-500 font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                                                {t.server.servers}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Footer decorative */}
                                <div className="border-t-2 border-yellow-400/30 p-2 bg-yellow-400/5">
                                    <div className="flex justify-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-400"></div>
                                        <div className="w-2 h-2 bg-yellow-400/50"></div>
                                        <div className="w-2 h-2 bg-yellow-400/30"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Join Server */}
                {showJoinModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div
                            className="relative w-full max-w-md p-8 border-2 border-green-400 bg-black/95"
                            style={{
                                clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
                                boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)"
                            }}
                        >
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-green-400"></div>
                                    <h2 className="text-2xl font-black text-green-400 uppercase" style={{ fontFamily: 'monospace' }}>
                                        {t.server.join}
                                    </h2>
                                </div>
                                <div className="h-px bg-green-400/30"></div>
                            </div>

                            <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: 'monospace' }}>
                                {t.server.enterInvite}
                            </p>

                            <input
                                type="text"
                                value={inviteLink}
                                onChange={(e) => setInviteLink(e.target.value)}
                                placeholder="https://linkyt.com/invite/INVITE_CODE"
                                className="w-full px-4 py-3 border-l-4 bg-black/70 text-green-300 placeholder-gray-600 focus:border-l-green-400 focus:bg-black outline-none transition-all mb-6"
                                style={{
                                    fontFamily: 'monospace',
                                    borderLeft: '4px solid #22c55e',
                                    borderTop: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderRight: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                                }}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={handleJoinServer}
                                    className="flex-1 py-3 border-2 border-green-400 bg-green-400 text-black font-black uppercase text-xs hover:bg-green-500 hover:border-green-500 transition-all"
                                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                                >
                                    {t.server.joinButton}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setInviteLink("");
                                    }}
                                    className="flex-1 py-3 border-2 border-gray-600 text-gray-400 font-black uppercase text-xs hover:bg-gray-600 hover:text-white transition-all"
                                    style={{ fontFamily: 'monospace' }}
                                >
                                    {t.common.cancel}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}
