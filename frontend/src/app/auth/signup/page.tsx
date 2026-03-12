"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";

type RegisterResponse = {
    username: string,
    user_id: string,
    email: string,
    create_at: string,
}

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [result, setResult] = useState<RegisterResponse | null>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    useEffect(() => {
        if (result) {
            setTimeout(() => {
                router.push("/auth/login");
            }, 2000);
        }
    }, [result, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(t.auth.loading);
        setResult(null);

        console.log("🔵 Envoi de la requête à:", `${apiBase}/auth/signup`);
        console.log("🔵 Données:", { username, password: "***", email });

        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email }),
            });

            console.log("🔵 Status de la réponse:", res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error("🔴 Erreur backend:", errText);
                
                // Messages d'erreur personnalisés
                if (errText.includes("nom d'utilisateur est déjà pris") || errText.includes("existe déjà")) {
                    setStatus(`❌ ${t.auth.userExists}`);
                } else if (errText.includes("email est déjà utilisé")) {
                    setStatus(`❌ ${t.auth.emailExists}`);
                } else {
                    setStatus(`❌ ${t.error.generic}: ${errText}`);
                }
                return;
            }

            const data = (await res.json()) as RegisterResponse;
            console.log("✅ Utilisateur créé:", data);
            setResult(data);
            setStatus(t.auth.signupSuccess);
            setUsername("");
            setEmail("");
            setPassword("");
        } catch (error) {
            console.error("🔴 Erreur réseau:", error);
            setStatus(t.error.network.replace('{message}', error instanceof Error ? error.message : 'Unknown'));
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
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

                {/* Effet scanline */}
                <div className="absolute inset-0 pointer-events-none opacity-5"
                     style={{
                         background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #FFD700 2px, #FFD700 4px)',
                     }}
                />

                {/* Lignes de glitch aléatoires */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20" />
                </div>

                {/* Formulaire cyberpunk */}
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

                    {/* Ornements en haut */}

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
                            {t.auth.signup}
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
                                Welcome to L!nkyt
                            </p>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-red-500" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-xs font-bold mb-2 tracking-widest uppercase"
                                style={{
                                    fontFamily: 'monospace',
                                    color: '#FFD700',
                                }}
                            >
                                {t.auth.username}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-l-4 bg-black/70 text-yellow-300 placeholder-gray-600 focus:border-l-yellow-400 focus:bg-black outline-none transition-all"
                                placeholder={t.auth.username}
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
                                htmlFor="email"
                                className="block text-xs font-bold mb-2 tracking-widest uppercase"
                                style={{
                                    fontFamily: 'monospace',
                                    color: '#FFD700',
                                }}
                            >
                                {t.auth.email}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-l-4 bg-black/70 text-yellow-300 placeholder-gray-600 focus:border-l-yellow-400 focus:bg-black outline-none transition-all"
                                placeholder="email@corp.net"
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
                                {t.auth.password}
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 mt-8 font-black uppercase transition-all border-2 tracking-widest hover:bg-yellow-400 hover:text-black active:scale-95"
                            style={{
                                fontFamily: 'monospace',
                                backgroundColor: '#000000',
                                borderColor: '#FFD700',
                                color: '#FFD700',
                                boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                                clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)",
                            }}
                        >
                            {t.auth.signupButton}
                        </button>
                    </form>

                    {status && (
                        <div className={`mt-4 p-4 text-center text-xs font-bold uppercase tracking-wider border-l-4 ${
                            status.includes("Erreur") || status.includes("réseau")
                                ? "bg-red-950/50 border-red-500 text-red-400"
                                : status.includes("réussie") || status.includes("Redirection")
                                    ? "bg-green-950/50 border-green-400 text-green-400"
                                    : "bg-yellow-950/50 border-yellow-400 text-yellow-400"
                        }`} style={{ fontFamily: 'monospace' }}>
                            {status}
                        </div>
                    )}

                    {result && (
                        <div className="mt-4 p-4 bg-yellow-950/30 border-l-4 border-yellow-400" style={{ fontFamily: 'monospace' }}>
                            <h3 className="font-black text-yellow-400 mb-2 text-center uppercase text-sm tracking-wider">{t.auth.signupSuccess}</h3>
                            <div className="text-xs text-yellow-300 space-y-1 text-center">
                                <p>User: <strong className="text-yellow-400">{result.username}</strong></p>
                                <p className="text-gray-500">Redirecting...</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center text-xs text-gray-500 font-bold uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        {t.auth.haveAccount}{" "}
                        <a href="/auth/login" className="text-yellow-400 hover:text-yellow-300 underline">
                            {t.auth.login}
                        </a>
                    </div>

                    {/* Ornements en bas */}
                    <div className="mt-6 flex justify-center gap-4 text-2xl text-amber-900/50">
                    </div>
                </main>

            </div>
    );
}
