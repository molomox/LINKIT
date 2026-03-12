"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";

type CreateChannelResponse = {
    channel_id: string;
    name: string;
    server_id: string;
};

export default function CreateChannelPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const serverId = params.serverId as string;

    const [name, setName] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [result, setResult] = useState<CreateChannelResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch(`${apiBase}/servers/${serverId}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(name),
            });

            if (!res.ok) {
                const errText = await res.text();
                setStatus(`${t.error.generic}: ${errText}`);
                setLoading(false);
                return;
            }

            const data = (await res.json()) as CreateChannelResponse;
            setResult(data);
            setStatus(t.channel.created);
            setName("");

            // Rediriger vers le serveur après 2 secondes
            setTimeout(() => {
                router.push(`/servers/${serverId}`);
            }, 2000);
        } catch (error) {
            setStatus(t.error.network.replace('{message}', error instanceof Error ? error.message : 'Unknown'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
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
                    @keyframes scanline {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(100%); }
                    }
                `
            }} />

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

            {/* Contenu principal */}
            <div className="relative z-10 w-full max-w-2xl mx-4">
                {/* Titre */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-12 bg-yellow-400"></div>
                        <h1 className="text-4xl font-black text-yellow-400 uppercase tracking-tight" style={{ fontFamily: 'monospace' }}>
                            {t.channel.create}
                        </h1>
                    </div>
                    <p className="text-gray-500 ml-4" style={{ fontFamily: 'monospace' }}>
                        &gt;&gt; Nouveau canal de communication - Serveur: {serverId.slice(0, 8)}...
                    </p>
                </div>

                {/* Formulaire */}
                <div className="border-2 border-yellow-400 bg-black/85 backdrop-blur-sm p-8"
                    style={{
                        clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))",
                        borderLeft: "4px solid #FFD700",
                        boxShadow: "0 0 30px rgba(255, 215, 0, 0.2)"
                    }}>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Messages de statut */}
                        {status && (
                            <div className={`border-2 p-4 ${
                                status.includes(t.error.generic) 
                                    ? "border-red-500 bg-red-500/10" 
                                    : "border-green-400 bg-green-400/10"
                            }`}
                                style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
                                <p className={`font-bold ${
                                    status.includes(t.error.generic) ? "text-red-500" : "text-green-400"
                                }`} style={{ fontFamily: 'monospace' }}>
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Nom du channel */}
                        <div className="space-y-3">
                            <label className="block text-yellow-400 font-bold uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                                <span className="text-yellow-400">◢</span> {t.channel.name}
                            </label>
                            <div className="border-2 border-yellow-400/50 bg-black/50 p-4 focus-within:border-yellow-400 transition-all"
                                style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t.channel.placeholder}
                                    className="w-full bg-transparent text-yellow-400 outline-none text-lg"
                                    style={{ fontFamily: 'monospace' }}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-gray-600 text-xs ml-2" style={{ fontFamily: 'monospace' }}>
                                {t.channel.allowedChars}
                            </p>
                        </div>

                        {/* Détails du résultat */}
                        {result && (
                            <div className="border-2 border-green-400 bg-green-400/10 p-4"
                                style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
                                <div className="text-green-400 font-bold mb-3 uppercase text-sm" style={{ fontFamily: 'monospace' }}>
                                    <span className="text-green-400">▶</span> {t.channel.created}
                                </div>
                                <div className="space-y-2 text-sm" style={{ fontFamily: 'monospace' }}>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">ID:</span>
                                        <span className="text-green-400">{result.channel_id}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">NOM:</span>
                                        <span className="text-green-400">#{result.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">SERVEUR:</span>
                                        <span className="text-green-400">{result.server_id}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Boutons d'action */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-1 px-6 py-4 border-2 border-yellow-400 bg-yellow-400 text-black font-bold uppercase text-sm tracking-wider hover:bg-yellow-500 hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}
                            >
                                {loading ? t.common.loading : t.channel.createButton}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.back()}
                                disabled={loading}
                                className="flex-1 px-6 py-4 border-2 border-red-500 text-red-500 font-bold uppercase text-sm tracking-wider hover:bg-red-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}
                            >
                                ← {t.common.cancel}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info additionnelle */}
                <div className="mt-6 border-2 border-yellow-400/30 bg-yellow-400/5 p-4"
                    style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
                    <p className="text-yellow-400/70 text-sm" style={{ fontFamily: 'monospace' }}>
                        <span className="text-yellow-400 font-bold">⚠ {t.channel.note}</span> {t.channel.noteText}
                    </p>
                </div>
            </div>

            {/* Lignes de glitch aléatoires */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-20" />
                <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-20" />
            </div>
        </div>
    );
}


