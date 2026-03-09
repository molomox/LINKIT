"use client";
import type { Server } from "../types";

type ServerModalsProps = {
    showLeaveModal: boolean;
    showDeleteModal: boolean;
    deleteConfirmName: string;
    actionLoading: boolean;
    server: Server | null;
    onCloseLeaveModal: () => void;
    onCloseDeleteModal: () => void;
    onLeaveServer: () => void;
    onDeleteServer: () => void;
    onDeleteConfirmNameChange: (name: string) => void;
};

export default function ServerModals({
    showLeaveModal,
    showDeleteModal,
    deleteConfirmName,
    actionLoading,
    server,
    onCloseLeaveModal,
    onCloseDeleteModal,
    onLeaveServer,
    onDeleteServer,
    onDeleteConfirmNameChange,
}: ServerModalsProps) {
    return (
        <>
            {/* Modal de confirmation pour quitter le serveur */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCloseLeaveModal}>
                    <div
                        className="bg-black border-2 border-orange-400/50 p-8 max-w-md w-full mx-4"
                        style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-black text-orange-400 uppercase mb-4" style={{ fontFamily: 'monospace' }}>
                            ⚠️ QUITTER LE SERVEUR
                        </h2>
                        <p className="text-gray-400 mb-6" style={{ fontFamily: 'monospace' }}>
                            Êtes-vous sûr de vouloir quitter <span className="text-yellow-400 font-bold">{server?.name}</span> ?
                        </p>
                        <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: 'monospace' }}>
                            Vous ne pourrez plus accéder aux messages et canaux de ce serveur.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCloseLeaveModal}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 border-2 border-gray-500 text-gray-400 font-bold uppercase text-sm hover:bg-gray-500 hover:text-black transition-all disabled:opacity-50"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={onLeaveServer}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 border-2 border-orange-400 bg-orange-400 text-black font-bold uppercase text-sm hover:bg-orange-500 hover:border-orange-500 transition-all disabled:opacity-50"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {actionLoading ? "..." : "Quitter"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation pour supprimer le serveur (Owner uniquement) */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCloseDeleteModal}>
                    <div
                        className="bg-black border-2 border-red-400/50 p-8 max-w-md w-full mx-4"
                        style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-black text-red-400 uppercase mb-4" style={{ fontFamily: 'monospace' }}>
                            🗑️ SUPPRIMER LE SERVEUR
                        </h2>
                        <p className="text-gray-400 mb-4" style={{ fontFamily: 'monospace' }}>
                            Cette action est <span className="text-red-400 font-bold">IRRÉVERSIBLE</span> !
                        </p>
                        <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: 'monospace' }}>
                            Tous les canaux, messages et membres seront définitivement supprimés.
                        </p>

                        <div className="mb-6">
                            <label className="block text-yellow-400 font-bold uppercase text-sm mb-2" style={{ fontFamily: 'monospace' }}>
                                Tapez le nom du serveur pour confirmer :
                            </label>
                            <div className="border-2 border-red-400/50 bg-black/50 p-3 focus-within:border-red-400 transition-all"
                                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}>
                                <input
                                    type="text"
                                    value={deleteConfirmName}
                                    onChange={(e) => onDeleteConfirmNameChange(e.target.value)}
                                    placeholder={server?.name}
                                    className="w-full bg-transparent text-red-400 outline-none"
                                    style={{ fontFamily: 'monospace' }}
                                    disabled={actionLoading}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCloseDeleteModal}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 border-2 border-gray-500 text-gray-400 font-bold uppercase text-sm hover:bg-gray-500 hover:text-black transition-all disabled:opacity-50"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={onDeleteServer}
                                disabled={actionLoading || deleteConfirmName !== server?.name}
                                className="flex-1 px-4 py-2 border-2 border-red-400 bg-red-400 text-black font-bold uppercase text-sm hover:bg-red-500 hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                {actionLoading ? "..." : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
