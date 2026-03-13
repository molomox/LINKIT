"use client";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import GifPicker from "@/components/GifPicker";
import type { Channel } from "../../../types";

type MessageInputProps = {
    newMessage: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onGifSelect?: (gifUrl: string) => void;
    selectedChannel: Channel | null;
    sending: boolean;
};

export default function MessageInput({
    newMessage,
    onChange,
    onSubmit,
    onGifSelect,
    selectedChannel,
    sending
}: MessageInputProps) {
    const { t } = useTranslation();
    const [showGifPicker, setShowGifPicker] = useState(false);

    const handleGifSelect = (gifUrl: string) => {
        if (onGifSelect) {
            onGifSelect(gifUrl);
        }
        setShowGifPicker(false);
    };
    
    return (
        <>
            <div className="p-4 border-t-2 border-yellow-400/30 bg-black/60">
                <form onSubmit={onSubmit} className="flex gap-3">
                    {/* Bouton GIF */}
                    <button
                        type="button"
                        onClick={() => setShowGifPicker(true)}
                        disabled={!selectedChannel || sending}
                        className="px-3 py-3 border-2 border-cyan-400/50 bg-cyan-400/10 text-cyan-400 font-bold uppercase text-sm hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
                        title="Send GIF"
                    >
                        🎬
                    </button>

                    {/* Input de message */}
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

                    {/* Bouton Envoyer */}
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

            {/* GIF Picker Modal */}
            {showGifPicker && (
                <GifPicker
                    onGifSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}
        </>
    );
}
