import type { Member } from "../../../types";

interface MemberContextMenuProps {
    contextMenu: {
        x: number;
        y: number;
        member: Member;
    };
    availableRoles: Array<{ id: string; name: string; color: string }>;
    canKick: boolean;
    canBan: boolean;
    canManageBan: boolean;
    isBanned: boolean;
    onRoleChange: (roleId: string) => void;
    onKick: () => void;
    onBan: () => void;
    onEditBan: () => void;
    onDeban: () => void;
    onClose: () => void;
}

export default function MemberContextMenu({
    contextMenu,
    availableRoles,
    canKick,
    canBan,
    canManageBan,
    isBanned,
    onRoleChange,
    onKick,
    onBan,
    onEditBan,
    onDeban,
    onClose,
}: MemberContextMenuProps) {
    return (
        <>
            {/* Overlay pour fermer le menu */}
            <div 
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            
            {/* Menu */}
            <div
                className="fixed z-50 backdrop-blur-sm min-w-[200px]"
                style={{
                    left: contextMenu.x,
                    top: contextMenu.y,
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    border: '2px solid #FFD700',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                }}
            >
                {/* Header */}
                <div className="px-4 py-2 border-b border-yellow-600">
                    <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                        {contextMenu.member.username}
                    </p>
                </div>

                {/* Liste des rôles */}
                {availableRoles.length > 0 && (
                    <div className="py-2">
                        <p className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                            Assigner un rôle
                        </p>
                        {availableRoles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => onRoleChange(role.id)}
                                className="w-full px-4 py-2 text-left hover:bg-yellow-900/20 transition-colors flex items-center gap-2"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {/* Pastille de couleur */}
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                />
                                <span className="text-sm" style={{ color: role.color }}>
                                    {role.name}
                                </span>
                                {/* Checkmark si c'est le rôle actuel */}
                                {contextMenu.member.role_id === role.id && (
                                    <span className="ml-auto text-yellow-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions supplémentaires */}
                {canKick && (
                    <>
                        {availableRoles.length > 0 && (
                            <div className="h-px bg-yellow-600 my-1" />
                        )}
                        <div className="py-2">
                            <p className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
                                Actions
                            </p>
                            <button
                                onClick={(e) => {
                                    console.log('👢 Kick button clicked');
                                    onKick();
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                style={{ fontFamily: 'monospace' }}
                            >
                                <span className="text-sm text-red-400">
                                    👢 Expulser
                                </span>
                            </button>
                            {canBan && !isBanned && (
                                <button
                                    onClick={onBan}
                                    className="w-full px-4 py-2 text-left hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                    style={{ fontFamily: 'monospace' }}
                                >
                                    <span className="text-sm text-red-600">
                                        🔨 Bannir
                                    </span>
                                </button>
                            )}
                            {canManageBan && isBanned && (
                                <>
                                    <button
                                        onClick={onEditBan}
                                        className="w-full px-4 py-2 text-left hover:bg-yellow-900/20 transition-colors flex items-center gap-2"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        <span className="text-sm text-yellow-500">
                                            ✏️ Modifier le ban
                                        </span>
                                    </button>
                                    <button
                                        onClick={onDeban}
                                        className="w-full px-4 py-2 text-left hover:bg-green-900/20 transition-colors flex items-center gap-2"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        <span className="text-sm text-green-500">
                                            🔓 Révoquer le ban
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
