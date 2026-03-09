"use client";
import { useRouter } from "next/navigation";
import type { Channel } from "../types";

type ChannelListProps = {
    channels: Channel[];
    selectedChannel: Channel | null;
    serverId: string;
    onSelectChannel: (channel: Channel) => void;
};

export default function ChannelList({
    channels,
    selectedChannel,
    serverId,
    onSelectChannel
}: ChannelListProps) {
    const router = useRouter();

    return (
        <aside className="w-60 border-r-2 border-yellow-400/30 bg-black/60 flex flex-col">
            <div className="p-4 border-b-2 border-yellow-400/30">
                <h2 className="text-yellow-400 font-bold uppercase text-sm tracking-wider" style={{ fontFamily: 'monospace' }}>
                    CHANNELS
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {channels.length === 0 ? (
                    <div className="p-4 text-gray-600 text-sm" style={{ fontFamily: 'monospace' }}>
                        Aucun channel disponible
                    </div>
                ) : (
                    channels.map((channel) => (
                        <button
                            key={channel.channel_id}
                            onClick={() => onSelectChannel(channel)}
                            className={`w-full text-left px-3 py-2 mb-1 transition-all ${
                                selectedChannel?.channel_id === channel.channel_id
                                    ? 'bg-yellow-400/20 border-l-4 border-yellow-400 text-yellow-400'
                                    : 'text-gray-400 hover:bg-yellow-400/10 hover:text-yellow-400'
                            }`}
                            style={{ fontFamily: 'monospace' }}
                        >
                            # {channel.name}
                        </button>
                    ))
                )}
            </div>
            <div className="p-4 border-t-2 border-yellow-400/30">
                <button
                    onClick={() => router.push(`/servers/${serverId}/channels/create`)}
                    className="w-full px-3 py-2 border-2 border-yellow-400/50 text-yellow-400 font-bold uppercase text-xs hover:bg-yellow-400 hover:text-black transition-all"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                >
                    ➕ CRÉER CHANNEL
                </button>
            </div>
        </aside>
    );
}
