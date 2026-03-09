// frontend/src/utils/storage.ts

/**
 * Gestionnaire de stockage isolé par onglet
 * Utilise sessionStorage pour éviter les conflits entre onglets
 */

export class SessionStorage {
    /**
     * Stocke les informations de l'utilisateur connecté
     */
    static setUserSession(userId: string, username: string, email: string) {
        sessionStorage.setItem("user_id", userId);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("session_timestamp", Date.now().toString());
    }

    /**
     * Récupère l'ID de l'utilisateur connecté
     */
    static getUserId(): string | null {
        return sessionStorage.getItem("user_id");
    }

    /**
     * Récupère le nom d'utilisateur
     */
    static getUsername(): string | null {
        return sessionStorage.getItem("username");
    }

    /**
     * Récupère l'email
     */
    static getEmail(): string | null {
        return sessionStorage.getItem("email");
    }

    /**
     * Vérifie si l'utilisateur est connecté dans cet onglet
     */
    static isAuthenticated(): boolean {
        return sessionStorage.getItem("user_id") !== null;
    }

    /**
     * Déconnecte l'utilisateur de cet onglet uniquement
     */
    static clearSession() {
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("session_timestamp");
    }

    /**
     * Récupère toutes les infos de session
     */
    static getSessionInfo() {
        return {
            userId: sessionStorage.getItem("user_id"),
            username: sessionStorage.getItem("username"),
            email: sessionStorage.getItem("email"),
            timestamp: sessionStorage.getItem("session_timestamp"),
        };
    }
}

/**
 * Hook React pour accéder à la session
 */
export const useSession = () => {
    return {
        userId: SessionStorage.getUserId(),
        username: SessionStorage.getUsername(),
        email: SessionStorage.getEmail(),
        isAuthenticated: SessionStorage.isAuthenticated(),
        clearSession: SessionStorage.clearSession,
        sessionInfo: SessionStorage.getSessionInfo(),
    };
};
