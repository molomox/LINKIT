export const ROLE_COLORS: Record<string, string> = {
    'role01' : '#6d0101', // Red ban role
    'role02' : '#808080', // Gray member role 
    'role03' : '#FFD700', // Gold admin role
    'role04' : '#ff0000',// Red owner role
}


export function getRoleColor(roleID: string): string {
    return ROLE_COLORS[roleID] || '#808080'; // Default to gray if role ID not found
}