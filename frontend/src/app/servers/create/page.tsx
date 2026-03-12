"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type CreateServerResponse = {
    server_id: string;
    name: string;
    create_at: string;
};

export default function CreateServerPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [serverName, setServerName] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(t.common.loading);
        setLoading(true);

        const userId = sessionStorage.getItem("user_id");
        if (!userId) {
            setStatus(t.error.unauthorized);
            setLoading(false);
            return;
        }

        console.log("🔵 Creating server:", { name: serverName, password: "***" });

        try {
            const res = await fetch(`${apiBase}/servers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: serverName,
                    password: password,
                    user_id: userId
                }),
            });

            console.log("🔵 Status:", res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error("🔴 Error:", errText);
                setStatus(`${t.error.generic}: ${errText}`);
                setLoading(false);
                return;
            }

            const data = (await res.json()) as CreateServerResponse;
            console.log("✅ Server created:", data);
            setStatus(t.server.created);

            setTimeout(() => {
                router.push("/auth/me");
            }, 1500);
        } catch (error) {
            console.error("🔴 Network error:", error);
            setStatus(t.error.network.replace('{message}', error instanceof Error ? error.message : 'Unknown'));
            setLoading(false);
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

            {/* Grille cyberpunk en fond */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #FFD700 2px, #FFD700 4px)',
                }}
            />

            {/* Lignes de glitch */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20" />
            </div>

            {/* Formulaire */}
            <main
                className="relative z-20 w-full max-w-md px-8 py-12 mx-4 backdrop-blur-sm"
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    border: "2px solid #FFD700",
                    borderLeft: "4px solid #FFD700",
                    boxShadow: "0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 50px rgba(255, 215, 0, 0.05)",
                    clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
                }}
            >
                {/* Back Button */}
                <button
                    onClick={() => router.push("/auth/me")}
                    className="mb-6 text-yellow-400 hover:text-yellow-300 font-bold text-xs uppercase flex items-center gap-2"
                    style={{ fontFamily: 'monospace' }}
                >
                    <span>&lt;&lt;</span> {t.nav.back}
                </button>

                {/* Header */}
                <div className="mb-6 text-center relative">
                    <div className="absolute top-0 left-0 w-12 h-0.5 bg-yellow-400" />
                    <div className="absolute top-0 right-0 w-12 h-0.5 bg-yellow-400" />

                    <h1
                        className="text-5xl font-black tracking-tight mb-3 uppercase"
                        style={{
                            fontFamily: 'monospace',
                            color: '#FFD700',
                            textShadow: '2px 2px 0px #FF0055, 4px 4px 0px rgba(255, 0, 85, 0.4)',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {t.server.create}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-red-500" />
                        <p
                            className="text-xs font-bold tracking-widest uppercase"
                            style={{
                                fontFamily: 'monospace',
                                color: '#FF0055',
                                textShadow: '0 0 10px #FF0055'
                            }}
                        >
                            NEW SERVER
                        </p>
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-red-500" />
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="serverName"
                            className="block text-xs font-bold mb-2 tracking-widest uppercase"
                            style={{
                                fontFamily: 'monospace',
                                color: '#FFD700',
                            }}
                        >
                            {t.server.name}
                        </label>
                        <input
                            id="serverName"
                            type="text"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            required
                            className="w-full px-4 py-3 border-l-4 bg-black/70 text-yellow-300 placeholder-gray-600 focus:border-l-yellow-400 focus:bg-black outline-none transition-all"
                            placeholder="Night City Central"
                            style={{
                                fontFamily: 'monospace',
                                borderLeft: '4px solid #FFD700',
                                borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                                borderRight: '1px solid rgba(255, 215, 0, 0.2)',
                                borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold mb-2 tracking-widest uppercase"
                            style={{
                                fontFamily: 'monospace',
                                color: '#FFD700',
                            }}
                        >
                            {t.server.password}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-l-4 bg-black/70 text-yellow-300 placeholder-gray-600 focus:border-l-yellow-400 focus:bg-black outline-none transition-all"
                            placeholder="••••••••"
                            style={{
                                fontFamily: 'monospace',
                                borderLeft: '4px solid #FFD700',
                                borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                                borderRight: '1px solid rgba(255, 215, 0, 0.2)',
                                borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                            }}
                        />
                        <p className="mt-2 text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                            {t.server.password}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-8 font-black uppercase transition-all border-2 tracking-widest hover:bg-yellow-400 hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            fontFamily: 'monospace',
                            backgroundColor: '#000000',
                            borderColor: '#FFD700',
                            color: '#FFD700',
                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                            clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
                        }}
                    >
                        {loading ? t.common.loading : t.server.createButton}
                    </button>
                </form>

                {/* Status Message */}
                {status && (
                    <div className={`mt-4 p-4 text-center text-xs font-bold uppercase tracking-wider border-l-4 ${
                        status.includes("Error") || status.includes("error")
                            ? "bg-red-950/50 border-red-500 text-red-400"
                            : status.includes("created") || status.includes("Redirecting")
                                ? "bg-green-950/50 border-green-400 text-green-400"
                                : "bg-yellow-950/50 border-yellow-400 text-yellow-400"
                    }`} style={{ fontFamily: 'monospace' }}>
                        {status}
                    </div>
                )}
            </main>
        </div>
    );
}
