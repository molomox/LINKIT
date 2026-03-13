"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n";

type GifPickerProps = {
    onGifSelect: (gifUrl: string) => void;
    onClose: () => void;
};

type GiphyGif = {
    id: string;
    images: {
        fixed_height: {
            url: string;
            width: string;
            height: string;
        };
        downsized: {
            url: string;
        };
    };
    title: string;
};

export default function GifPicker({ onGifSelect, onClose }: GifPickerProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [gifs, setGifs] = useState<GiphyGif[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    const baseUrl = "https://api.giphy.com/v1/gifs";

    // Charger les GIFs tendance au démarrage
    useEffect(() => {
        loadTrendingGifs();
    }, []);

    // Recherche avec debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim()) {
            searchTimeoutRef.current = setTimeout(() => {
                searchGifs(searchQuery);
            }, 500);
        } else {
            loadTrendingGifs();
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const loadTrendingGifs = async () => {
        if (!apiKey) {
            setError("GIPHY API key missing (NEXT_PUBLIC_GIPHY_API_KEY)");
            setGifs([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${baseUrl}/trending?api_key=${apiKey}&limit=20&rating=g`
            );
            if (!response.ok) {
                throw new Error(`Giphy API error: ${response.status}`);
            }
            const data = await response.json();
            setGifs(data.data || []);
        } catch (error) {
            console.error("Error loading trending GIFs:", error);
            setError(error instanceof Error ? error.message : "Error loading GIFs");
            setGifs([]);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (query: string) => {
        if (!apiKey) {
            setError("GIPHY API key missing (NEXT_PUBLIC_GIPHY_API_KEY)");
            setGifs([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${baseUrl}/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );
            if (!response.ok) {
                throw new Error(`Giphy API error: ${response.status}`);
            }
            const data = await response.json();
            setGifs(data.data || []);
        } catch (error) {
            console.error("Error searching GIFs:", error);
            setError(error instanceof Error ? error.message : "Error searching GIFs");
            setGifs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGifClick = (gif: GiphyGif) => {
        onGifSelect(gif.images.downsized.url);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[80vh] bg-black border-2 border-yellow-400 overflow-hidden"
                style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-yellow-400/30 bg-black/80 flex items-center justify-between">
                    <h2 className="text-yellow-400 font-bold uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        🎬 {t.gif?.title || "SELECT A GIF"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 border-2 border-red-400/50 text-red-400 font-bold uppercase text-xs hover:bg-red-400 hover:text-black transition-all"
                        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}
                    >
                        ✕ {t.common?.close || "CLOSE"}
                    </button>
                </div>

                {/* Search bar */}
                <div className="p-4 bg-black/60">
                    <div className="border-2 border-yellow-400/50 bg-black/50 p-3 focus-within:border-yellow-400 transition-all"
                        style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.gif?.search || "Search GIFs..."}
                            className="w-full bg-transparent text-yellow-400 outline-none placeholder-gray-600"
                            style={{ fontFamily: 'monospace' }}
                            autoFocus
                        />
                    </div>
                </div>

                {/* GIF Grid */}
                <div className="p-4 overflow-y-auto bg-black/40" style={{ maxHeight: 'calc(80vh - 180px)' }}>
                    {error ? (
                        <div className="text-center text-red-400 py-8" style={{ fontFamily: 'monospace' }}>
                            {error}
                        </div>
                    ) : loading ? (
                        <div className="text-center text-yellow-400 py-8" style={{ fontFamily: 'monospace' }}>
                            {t.common?.loading || "Loading..."}
                        </div>
                    ) : gifs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8" style={{ fontFamily: 'monospace' }}>
                            {t.gif?.noResults || "No GIFs found"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {gifs.map((gif) => (
                                <button
                                    key={gif.id}
                                    onClick={() => handleGifClick(gif)}
                                    className="relative aspect-square overflow-hidden border-2 border-yellow-400/30 hover:border-yellow-400 transition-all cursor-pointer"
                                    style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                                    title={gif.title}
                                >
                                    <img
                                        src={gif.images.fixed_height.url}
                                        alt={gif.title}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-yellow-400/30 bg-black/80 text-center">
                    <span className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                        Powered by GIPHY
                    </span>
                </div>
            </div>
        </>
    );
}
