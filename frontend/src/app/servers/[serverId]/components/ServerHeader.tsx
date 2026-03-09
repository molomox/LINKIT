"use client";
import { useRouter } from "next/navigation";
import type { Server, Channel } from "../types";
import type { WebSocketStatus } from "@/hooks/useWebSocket";

type ServerHeaderProps = {
    server: Server | null;
    selectedChannel: Channel | null;
    wsStatus: WebSocketStatus;
    copied: boolean;
    isOwner: boolean;
    canLeave: boolean;
    onCopyInvite: () => void;
    onShowLeaveModal: () => void;
    onShowDeleteModal: () => void;
};

export default function ServerHeader({
    server,
    selectedChannel,
    wsStatus,
    copied,
    isOwner,
    canLeave,
    onCopyInvite,
    onShowLeaveModal,
    onShowDeleteModal,
}: ServerHeaderProps) {
    const router = useRouter();

    return (
        <header className="border-b-2 border-yellow-400/30 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/auth/me')}
                    className="px-3 py-1 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                >
                    ← RETOUR
                </button>
                <div>
                    <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        {server?.name || "Serveur"}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Indicateur WebSocket */}
                <div className="flex items-center gap-2 px-2 py-1 border border-yellow-400/30 bg-black/50"
                    style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
                    <div className={`w-2 h-2 rounded-full ${
                        wsStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                        wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        wsStatus === 'error' ? 'bg-red-400' :
                        'bg-gray-600'
                    }`} />
                    <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        {wsStatus === 'connected' ? 'LIVE' :
                         wsStatus === 'connecting' ? 'CONNECTING...' :
                         wsStatus === 'error' ? 'ERROR' :
                         'OFFLINE'}
                    </span>
                </div>
                <div className="text-yellow-400/70 text-sm" style={{ fontFamily: 'monospace' }}>
                    {selectedChannel ? `# ${selectedChannel.name}` : ""}
                </div>
                <button
                    onClick={onCopyInvite}
                    className="px-3 py-1 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                    title="Copier le lien d'invitation"
                >
                    {copied ? "✓ COPIÉ" : "🔗 INVITER"}
                </button>

                {/* Bouton Quitter (pour membres et admins) */}
                {canLeave && (
                    <button
                        onClick={onShowLeaveModal}
                        className="px-3 py-1 border-2 border-orange-400/50 text-orange-400 font-bold uppercase text-xs hover:bg-orange-400 hover:text-black transition-all"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                        title="Quitter le serveur"
                    >
                        👋 QUITTER
                    </button>
                )}

                {/* Bouton Supprimer (pour owner uniquement) */}
                {isOwner && (
                    <button
                        onClick={onShowDeleteModal}
                        className="px-3 py-1 border-2 border-red-400/50 text-red-400 font-bold uppercase text-xs hover:bg-red-400 hover:text-black transition-all"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                        title="Supprimer le serveur"
                    >
                        🗑️ SUPPRIMER
                    </button>
                )}
            </div>
        </header>
    );
}
