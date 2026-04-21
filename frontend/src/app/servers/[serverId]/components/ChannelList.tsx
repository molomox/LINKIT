"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import type { Channel } from "../types";

type ChannelListProps = {
    channels: Channel[];
    selectedChannel: Channel | null;
    serverId: string;
    onSelectChannel: (channel: Channel) => void;
    onDeleteChannel?: (channelId: string, channelName: string) => void;
    currentUserRole?: string;
};


export default function ChannelList({
    channels,
    selectedChannel,
    serverId,
    onSelectChannel,
    onDeleteChannel,
    currentUserRole
}: ChannelListProps) {
    const router = useRouter();
    const { t } = useTranslation();
    
    // Vérifier si l'utilisateur peut supprimer des channels (Owner ou Admin)
    const canDeleteChannels = currentUserRole === 'role04' || currentUserRole === 'role03';

    return (
        <aside className="w-60 border-r-2 border-yellow-400/30 bg-black/60 flex flex-col">
            <div className="p-4 border-b-2 border-yellow-400/30">
                <h2 className="text-yellow-400 font-bold uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                    {t.channel.channels}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {channels.length === 0 ? (
                    <div className="p-4 text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                        {t.channel.noChannels}
                    </div>
                ) : (
                    channels.map((channel) => (
                        <div key={channel.channel_id} className="flex items-center gap-1 mb-1">
                            <button
                                onClick={() => onSelectChannel(channel)}
                                className={`flex-1 text-left px-3 py-2 transition-all ${
                                    selectedChannel?.channel_id === channel.channel_id
                                        ? 'bg-yellow-400/20 border-l-4 border-yellow-400 text-yellow-400'
                                        : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-400'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                            >
                                # {channel.name}
                            </button>
                            
                            {/* Bouton supprimer - seulement pour Owner/Admin */}
                            {canDeleteChannels && onDeleteChannel && (
                                <button
                                    onClick={() => {
                                        if (confirm(t.channel.deleteConfirm.replace('{name}', channel.name))) {
                                            onDeleteChannel(channel.channel_id, channel.name);
                                        }
                                    }}
                                    className="px-2 py-2 text-red-500 hover:bg-red-500/20 border border-red-500/50 transition-all text-xs"
                                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}
                                    title={t.channel.delete}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t-2 border-yellow-400/30">
                <button
                    onClick={() => router.push(`/servers/${serverId}/channels/create`)}
                    className="w-full px-3 py-2 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
                    textShadow: "0 0 2px #000000, 0 0 5px yellow, 0 0 1px yellow, 0 0 10px yellow"
                     }}
                >
                    {t.channel.createButton}
                </button>
            </div>
        </aside>
    );
}
