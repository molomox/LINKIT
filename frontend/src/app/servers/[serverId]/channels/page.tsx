"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Channel = {
    channel_id: string;
    name: string;
    server_id: string;
    create_at: string;
};

type Member = {
    user_id: string;
    username: string;
    role_name: string;
    join_at: string;
};

export default function ListChannelsPage() {
    const params = useParams();
    const router = useRouter();
    const serverId = params.serverId as string;

    const [channels, setChannels] = useState<Channel[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Récupérer les channels
                const channelsRes = await fetch(`${apiBase}/servers/${serverId}/channels`);
                if (!channelsRes.ok) {
                    throw new Error(`Erreur ${channelsRes.status}: ${await channelsRes.text()}`);
                }
                const channelsData = await channelsRes.json();
                setChannels(channelsData);

                // Récupérer les membres
                const membersRes = await fetch(`${apiBase}/servers/${serverId}/members`);
                if (membersRes.ok) {
                    const membersData = await membersRes.json();
                    setMembers(membersData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur réseau");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serverId, apiBase]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-black p-8 relative overflow-hidden">
            {/* Fond mystique avec motifs */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-900 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-purple-300 hover:text-purple-100 mb-4 inline-flex items-center gap-2 font-serif tracking-wide"
                    >
                        ◄ Retour aux Royaumes
                    </button>

                    <div className="flex items-center justify-between border-2 border-purple-900/50 bg-slate-900/80 backdrop-blur-sm p-6 rounded-lg shadow-2xl">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-purple-200 mb-2 tracking-wider flex items-center gap-3">
                                <span className="text-4xl">𒀭</span>
                                Chambres du Temple
                            </h1>
                            <p className="text-sm text-emerald-400 font-mono tracking-widest">
                                ⟨ Temple ID: {serverId} ⟩
                            </p>
                        </div>

                        <Link
                            href={`/servers/${serverId}/channels/create`}
                            className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-700 hover:to-purple-900 text-purple-100 font-serif font-semibold rounded-lg shadow-xl transition-all active:scale-95 border border-purple-600/50 tracking-wide"
                        >
                            ✦ Ouvrir une Nouvelle Chambre
                        </Link>
                    </div>
                </div>


                {/* Layout principal avec channels à gauche et membres à droite */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Colonne principale - Channels (75% de la largeur sur grand écran) */}
                    <div className="lg:col-span-3">
                        {/* Loading State */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                                <p className="text-purple-300 font-serif text-lg">Les anciens révèlent leurs secrets...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="p-6 bg-red-950/50 border-2 border-red-900 rounded-lg text-red-400 backdrop-blur-sm shadow-2xl">
                                <strong className="text-red-300 font-serif text-xl">⚠ Malédiction:</strong>
                                <p className="mt-2 font-serif">{error}</p>
                            </div>
                        )}

                        {/* Channels List */}
                        {!loading && !error && (
                            <>
                                {channels.length === 0 ? (
                                    <div className="text-center py-16 bg-slate-900/50 backdrop-blur-sm rounded-lg border-2 border-purple-900/50 shadow-2xl">
                                        <div className="text-7xl mb-6 opacity-50">𒀭</div>
                                        <h3 className="text-2xl font-serif font-semibold text-purple-200 mb-3 tracking-wide">
                                            Les Chambres sont Silencieuses
                                        </h3>
                                        <p className="text-sm text-purple-400 mb-6 font-serif italic">
                                            Aucune chambre n&apos;a encore été ouverte dans ce temple ancien...
                                        </p>
                                        <Link
                                            href={`/servers/${serverId}/channels/create`}
                                            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-700 hover:to-purple-900 text-purple-100 font-serif font-semibold rounded-lg transition-all shadow-xl border border-purple-600/50"
                                        >
                                            ✦ Ouvrir la Première Chambre Sacrée
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {channels.map((channel) => (
                                            <div
                                                key={channel.channel_id}
                                                className="p-6 bg-slate-900/60 backdrop-blur-sm rounded-lg border-2 border-purple-900/50 hover:border-purple-600 transition-all shadow-xl hover:shadow-2xl hover:shadow-purple-900/50 group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-2xl font-serif font-bold text-purple-200 mb-3 flex items-center gap-3 group-hover:text-purple-100 transition-colors">
                                                            <span className="text-purple-400 text-3xl">𒀸</span>
                                                            {channel.name}
                                                        </h3>
                                                        <div className="space-y-2 text-sm">
                                                            <p className="text-purple-400 font-mono tracking-wider">
                                                                <span className="text-emerald-500">⟨ID⟩</span> {channel.channel_id}
                                                            </p>
                                                            <p className="text-purple-400 font-serif">
                                                                <span className="text-emerald-500">⟨Ouvert le⟩</span> {channel.create_at}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            alert(`Entrer dans la chambre ${channel.name}`);
                                                        }}
                                                        className="px-6 py-3 bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-emerald-200 font-serif rounded-lg transition-all border border-emerald-700/50 shadow-lg hover:shadow-emerald-900/50"
                                                    >
                                                        Entrer ►
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Summary */}
                                {channels.length > 0 && (
                                    <div className="mt-8 text-center">
                                        <div className="inline-block px-6 py-3 bg-slate-900/50 backdrop-blur-sm border border-purple-900/50 rounded-lg">
                                            <p className="text-purple-300 font-serif tracking-wide">
                                                <span className="text-emerald-400 font-bold">{channels.length}</span> Chambre{channels.length > 1 ? "s" : ""} Découverte{channels.length > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sidebar droite - Membres (25% de la largeur sur grand écran) */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/60 backdrop-blur-sm rounded-lg border-2 border-purple-900/50 p-6 sticky top-8">
                            <h2 className="text-xl font-serif font-bold text-purple-200 mb-4 flex items-center gap-2">
                                <span className="text-2xl">👥</span>
                                Gardiens du Temple
                            </h2>

                            {loading ? (
                                <div className="flex flex-col items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
                                </div>
                            ) : members.length === 0 ? (
                                <p className="text-purple-400 text-sm font-serif italic text-center py-4">
                                    Aucun gardien présent...
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {members.map((member) => (
                                        <div
                                            key={member.user_id}
                                            className="p-3 bg-slate-800/50 rounded-lg border border-purple-900/30 hover:border-purple-600/50 transition-all"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <p className="text-purple-100 font-serif font-semibold">
                                                    {member.username}
                                                </p>
                                            </div>
                                            <p className="text-xs text-purple-400 font-mono ml-4">
                                                {member.role_name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {members.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-purple-900/50">
                                    <p className="text-center text-sm text-purple-400 font-serif">
                                        <span className="text-emerald-400 font-bold">{members.length}</span> Gardien{members.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Symboles cunéiformes décoratifs */}
            <div className="fixed top-10 right-10 text-6xl text-purple-900/20 pointer-events-none animate-pulse">𒀭</div>
            <div className="fixed bottom-10 left-10 text-6xl text-purple-900/20 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}>𒀸</div>
        </div>
    );
}
