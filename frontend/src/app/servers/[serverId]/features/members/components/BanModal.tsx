import type { Member } from "../../../types";

interface BanModalProps {
    banTarget: Member;
    isEditMode: boolean;
    banReason: string;
    setBanReason: (value: string) => void;
    isPermanentBan: boolean;
    setIsPermanentBan: (value: boolean) => void;
    banMonths: number;
    setBanMonths: (value: number) => void;
    banDays: number;
    setBanDays: (value: number) => void;
    banHours: number;
    setBanHours: (value: number) => void;
    banMinutes: number;
    setBanMinutes: (value: number) => void;
    banSeconds: number;
    setBanSeconds: (value: number) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export default function BanModal({
    banTarget,
    isEditMode,
    banReason,
    setBanReason,
    isPermanentBan,
    setIsPermanentBan,
    banMonths,
    setBanMonths,
    banDays,
    setBanDays,
    banHours,
    setBanHours,
    banMinutes,
    setBanMinutes,
    banSeconds,
    setBanSeconds,
    onSubmit,
    onClose,
}: BanModalProps) {
    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 z-50 bg-black/80"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div
                className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] backdrop-blur-sm"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    border: '2px solid #DC2626',
                    boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-red-600">
                    <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                        {isEditMode ? '✏️ MODIFIER LE BAN DE' : '🔨 BANNIR'} {banTarget.username}
                    </h3>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Raison */}
                    <div>
                        <label className="block text-yellow-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                            Raison du bannissement *
                        </label>
                        <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Ex: Spam, comportement toxique, violation des règles..."
                            className="w-full px-3 py-2 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 resize-none"
                            style={{ fontFamily: 'monospace' }}
                            rows={4}
                        />
                    </div>

                    {/* Case à cocher pour ban permanent */}
                    <div className="flex items-center gap-3 p-3 bg-red-900/20 border-2 border-red-600 rounded">
                        <input
                            type="checkbox"
                            id="permanentBan"
                            checked={isPermanentBan}
                            onChange={(e) => setIsPermanentBan(e.target.checked)}
                            className="w-5 h-5 cursor-pointer"
                        />
                        <label 
                            htmlFor="permanentBan" 
                            className="text-red-400 font-bold cursor-pointer select-none"
                            style={{ fontFamily: 'monospace' }}
                        >
                            ⚠️ BANNISSEMENT PERMANENT
                        </label>
                    </div>

                    {/* Durée */}
                    <div>
                        <label className="block text-yellow-400 text-sm font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                            Durée du bannissement {!isPermanentBan && '*'}
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {/* Mois */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Mois</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="12"
                                    value={banMonths}
                                    onChange={(e) => setBanMonths(parseInt(e.target.value) || 0)}
                                    disabled={isPermanentBan}
                                    className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            {/* Jours */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Jours</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={banDays}
                                    onChange={(e) => setBanDays(parseInt(e.target.value) || 0)}
                                    disabled={isPermanentBan}
                                    className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            {/* Heures */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Heures</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    value={banHours}
                                    onChange={(e) => setBanHours(parseInt(e.target.value) || 0)}
                                    disabled={isPermanentBan}
                                    className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            {/* Minutes */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Min</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={banMinutes}
                                    onChange={(e) => setBanMinutes(parseInt(e.target.value) || 0)}
                                    disabled={isPermanentBan}
                                    className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            {/* Secondes */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1" style={{ fontFamily: 'monospace' }}>Sec</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={banSeconds}
                                    onChange={(e) => setBanSeconds(parseInt(e.target.value) || 0)}
                                    disabled={isPermanentBan}
                                    className="w-full px-2 py-1 bg-black/60 border-2 border-yellow-600 text-gray-300 rounded focus:outline-none focus:border-yellow-400 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                        </div>
                        {!isPermanentBan && (
                            <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                💡 Spécifiez au moins une durée pour le bannissement
                            </p>
                        )}
                        {isPermanentBan && (
                            <p className="text-red-400 text-xs mt-2 font-bold" style={{ fontFamily: 'monospace' }}>
                                ⚠️ Le bannissement sera PERMANENT (100 ans)
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-red-600 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                        style={{ fontFamily: 'monospace' }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-bold"
                        style={{ fontFamily: 'monospace' }}
                    >
                        {isEditMode ? '✏️ MODIFIER' : '🔨 BANNIR'}
                    </button>
                </div>
            </div>
        </>
    );
}
