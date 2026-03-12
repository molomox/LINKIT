// ==========================================
// CONSTANTES DE L'APPLICATION
// ==========================================

// Clés de stockage (sessionStorage/localStorage)
export const STORAGE_KEYS = {
  USER_ID: 'user_id',
  USERNAME: 'username',
  EMAIL: 'email',
  TOKEN: 'token',
  SESSION_TIMESTAMP: 'session_timestamp',
} as const;

// URLs par défaut (fallbacks si les variables d'environnement ne sont pas définies)
export const DEFAULT_API_URL = 'http://localhost:3000';
export const DEFAULT_WS_URL = 'ws://localhost:3000';

// Configuration API
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL,
} as const;

// Durée de session (en millisecondes)
export const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Roles
export const ROLES = {
  BANNED: 'role01',
  MEMBER: 'role02',
  ADMIN: 'role03',
  OWNER: 'role04',
} as const;

// Couleurs des rôles
export const ROLE_COLORS = {
  [ROLES.BANNED]: '#6d0101',
  [ROLES.MEMBER]: '#808080',
  [ROLES.ADMIN]: '#FFD700',
  [ROLES.OWNER]: '#FF0000',
} as const;
