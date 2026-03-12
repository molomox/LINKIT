"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";

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

export default function DashboardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [servers, setServers] = useState<Server[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    useEffect(() => {
        let isMounted = true;

        const loadUserData = async () => {
            try {
                // Récupérer l'user_id du sessionStorage
                const userId = sessionStorage.getItem("user_id");
                const storedUsername = sessionStorage.getItem("username");
                const storedEmail = sessionStorage.getItem("email");

                if (!userId) {
                    router.push("/auth/login");
                    return;
                }

                // Charger les informations utilisateur
                const userRes = await fetch(`${apiBase}/me?user_id=${userId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
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
                    // Si l'API échoue, utiliser les données du localStorage
                    setUser({
                        username: storedUsername || "User",
                        email: storedEmail || "user@nightcity.net",
                        user_id: userId,
                        create_at: new Date().toISOString(),
                    });
                }

                // Charger les serveurs
                console.log("🔵 [MOUNT] Chargement des serveurs pour user_id:", userId);
                const serversRes = await fetch(`${apiBase}/servers?user_id=${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!isMounted) return;

                console.log("🔵 Status serveurs:", serversRes.status);

                if (serversRes.ok) {
                    const serversData = await serversRes.json();
                    console.log("✅ Serveurs chargés:", serversData);
                    setServers(serversData.map((server: ServerApiResponse) => ({
                        id: server.server_id,
                        name: server.name,
                        memberCount: 0,
                    })));
                } else {
                    const errorText = await serversRes.text();
                    console.error("🔴 Erreur chargement serveurs:", errorText);
                    setServers([]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur lors du chargement:", error);
                if (isMounted) {
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

    const handleJoinServer = async () => {
        if (!inviteLink.trim()) return;

        // Extraire le server_id du lien d'invitation
        const serverId = inviteLink.split('/').pop();

        if (serverId) {
            router.push(`/servers/${serverId}`);
        }

        setShowJoinModal(false);
        setInviteLink("");
    };

    if (loading) {
        return (
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
        );
    }

    return (
        <>
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
                                placeholder="https://linkyt.com/invite/SERVER_ID"
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
        </>
    );
}
