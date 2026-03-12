"use client";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import type { Message } from "../../../types";

type MessageItemProps = {
    message: Message;
    currentUserId: string | null;
    currentUserRole: string | null;
    onDelete: (messageId: string) => void;
    onUpdate: (messageId: string, newContent: string) => void;
};

function formatDate(dateString: string, t: any) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t.message.justNow;
        if (diffMins < 60) return t.message.minutesAgo.replace('{minutes}', diffMins.toString());
        if (diffHours < 24) return t.message.hoursAgo.replace('{hours}', diffHours.toString());
        if (diffDays < 7) return t.message.daysAgo.replace('{days}', diffDays.toString());
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
        return dateString;
    }
}

export default function MessageItem({ message, currentUserId, currentUserRole, onDelete, onUpdate }: MessageItemProps) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    
    const isOwnMessage = message.user_id === currentUserId;
    const isSystemMessage = message.user_id === 'system';
    
    // Permissions : Seul le propriétaire peut éditer son message, Owner/Admin peuvent supprimer
    const canEdit = isOwnMessage;
    const canDelete = isOwnMessage || currentUserRole === 'Owner' || currentUserRole === 'Admin';
    
    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== message.content) {
            onUpdate(message.message_id, editContent.trim());
        }
        setIsEditing(false);
    };
    
    const handleCancelEdit = () => {
        setEditContent(message.content);
        setIsEditing(false);
    };

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
        <div className="group p-3 hover:bg-yellow-400/5 transition-colors border-l-2 border-transparent hover:border-yellow-400/50">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-yellow-400 font-semibold text-sm" style={{ fontFamily: 'monospace' }}>
                            {message.username || t.message.defaultUser}
                            {isOwnMessage && t.member.you}
                        </span>
                        <span className="text-gray-600 text-xs" style={{ fontFamily: 'monospace' }}>
                            {formatDate(message.create_at, t)}
                        </span>
                    </div>
                    
                    {isEditing ? (
                        <div className="flex gap-2 items-center mt-2">
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="flex-1 bg-black/50 border border-yellow-400/30 text-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                                autoFocus
                            />
                            <button
                                onClick={handleSaveEdit}
                                className="text-green-400 hover:text-green-300 text-xs px-2 py-1 border border-green-400/50 hover:bg-green-400/10"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {t.message.saveEdit}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 border border-gray-400/50 hover:bg-gray-400/10"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {t.message.cancelEdit}
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                            {message.content}
                        </p>
                    )}
                </div>

                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
                    {canEdit && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 border border-blue-400/50 hover:bg-blue-400/10 transition-all"
                            style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}
                            title={t.message.editTooltip}
                        >
                            {t.message.editAction}
                        </button>
                    )}
                    {canDelete && !isEditing && (
                        <button
                            onClick={() => onDelete(message.message_id)}
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-400/50 hover:bg-red-400/10 transition-all"
                            style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}
                            title={t.message.deleteTooltip}
                        >
                            {t.message.deleteAction}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
