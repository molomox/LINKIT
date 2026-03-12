"use client";
import { useTranslation } from "@/i18n";
import type { Channel } from "../../../types";

type MessageInputProps = {
    newMessage: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    selectedChannel: Channel | null;
    sending: boolean;
};

export default function MessageInput({
    newMessage,
    onChange,
    onSubmit,
    selectedChannel,
    sending
}: MessageInputProps) {
    const { t } = useTranslation();
    
    return (
        <div className="p-4 border-t-2 border-yellow-400/30 bg-black/60">
            <form onSubmit={onSubmit} className="flex gap-3">
                <div className="flex-1 border-2 border-yellow-400/50 bg-black/50 p-3 focus-within:border-yellow-400 transition-all"
                    style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={onChange}
                        placeholder={t.message.placeholder.replace('{channel}', selectedChannel?.name || 'channel')}
                        className="w-full bg-transparent text-yellow-400 outline-none"
                        style={{ fontFamily: 'monospace' }}
                        disabled={!selectedChannel || sending}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!selectedChannel || !newMessage.trim() || sending}
                    className="px-6 py-3 border-2 border-yellow-400 bg-yellow-400 text-black font-bold uppercase text-sm hover:bg-yellow-300 hover:border-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                >
                    {sending ? "..." : t.message.send}
                </button>
            </form>
        </div>
    );
}
