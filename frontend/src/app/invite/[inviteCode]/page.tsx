"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { buildAuthHeaders } from "@/utils/authHeaders";

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const inviteCode = params.inviteCode as string;

    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const handleJoin = async () => {
        setJoining(true);
        setError(null);

        try {
            const userId = sessionStorage.getItem("user_id");
            if (!userId) {
                router.push("/auth/login");
                return;
            }

            const res = await fetch(`${apiBase}/invite/${inviteCode}`, {
                method: "POST",
                headers: buildAuthHeaders(),
                body: JSON.stringify({ user_id: userId }),
            });

            if (!res.ok) {
                const errText = await res.text();
                setError(errText);
                setJoining(false);
                return;
            }

            const data = await res.json();
            // Rediriger vers le serveur rejoint
            router.push(`/servers/${data.server.server_id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : t.error.network.replace('{message}', 'Unknown'));
            setJoining(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
            {/* Sélecteur de langue */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes glitch {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                `
            }} />

            {/* Grille cyberpunk */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            <main className="relative z-10 w-full max-w-md p-8">
                <div className="bg-black/80 border-2 border-yellow-400 p-8"
                    style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}>

                    <div className="mb-6 text-center">
                        <div className="inline-block border-4 border-yellow-400 p-4 mb-4"
                            style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
                            <span className="text-6xl">🔗</span>
                        </div>
                        <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-wider mb-2"
                            style={{ fontFamily: 'monospace' }}>
                            {t.server.join}
                        </h1>
                        <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4"></div>
                        <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                            {t.server.enterInvite}
                        </p>
                    </div>

                    <div className="mb-6 p-4 bg-yellow-400/10 border-l-4 border-yellow-400">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: 'monospace' }}>
                            {t.server.inviteCode}
                        </div>
                        <div className="text-yellow-400 font-bold break-all" style={{ fontFamily: 'monospace' }}>
                            {inviteCode}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-950/50 border-l-4 border-red-500 text-red-400 text-xs font-bold uppercase"
                            style={{ fontFamily: 'monospace' }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-4 font-black uppercase transition-all border-2 tracking-widest hover:bg-yellow-400 hover:text-black active:scale-95 disabled:opacity-50"
                        style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#000000',
                            borderColor: '#FFD700',
                            color: '#FFD700',
                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                            clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
                        }}
                    >
                        {joining ? t.common.loading : t.server.joinButton}
                    </button>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push("/auth/me")}
                            className="text-gray-500 text-xs uppercase hover:text-yellow-400 transition-colors"
                            style={{ fontFamily: 'monospace' }}
                        >
                            ← {t.nav.back}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
