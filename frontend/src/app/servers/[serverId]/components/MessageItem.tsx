"use client";
import type { Message } from "../types";

type MessageItemProps = {
    message: Message;
    currentUserId: string | null;
    onDelete: (messageId: string, messageUserId: string) => void;
};

function formatDate(dateString: string) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "à l'instant";
        if (diffMins < 60) return `il y a ${diffMins} min`;
        if (diffHours < 24) return `il y a ${diffHours}h`;
        if (diffDays < 7) return `il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
        return dateString;
    }
}

export default function MessageItem({ message, currentUserId, onDelete }: MessageItemProps) {
    const isOwnMessage = message.user_id === currentUserId;
    const isSystemMessage = message.user_id === 'system';

    // Message système (join/leave)
    if (isSystemMessage) {
        return (
            <div className="p-2 my-2">
                <div className="flex items-center justify-center gap-2">
                    <div className="h-px bg-yellow-400/30 flex-1" />
                    <span className="text-yellow-400/70 text-xs uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        {message.content}
                    </span>
                    <div className="h-px bg-yellow-400/30 flex-1" />
                </div>
            </div>
        );
    }

    // Message normal
    return (
        <div className="message-hover p-3 rounded transition-all group">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center shrink-0"
                    style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}>
                    <span className="text-yellow-400 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                        {message.username?.[0]?.toUpperCase() || "?"}
                    </span>
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className={`font-bold text-sm ${isOwnMessage ? 'text-green-400' : 'text-yellow-400'}`} style={{ fontFamily: 'monospace' }}>
                            {message.username || "Utilisateur"}
                            {isOwnMessage && " (vous)"}
                        </span>
                        <span className="text-gray-600 text-xs" style={{ fontFamily: 'monospace' }}>
                            {formatDate(message.create_at)}
                        </span>
                        {isOwnMessage && (
                            <button
                                onClick={() => onDelete(message.message_id, message.user_id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-400/50 hover:bg-red-400/10 transition-all"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}
                                title="Supprimer ce message"
                            >
                                🗑️ Supprimer
                            </button>
                        )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}
