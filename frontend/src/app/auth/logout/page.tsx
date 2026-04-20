    "use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { buildAuthHeaders } from "@/utils/authHeaders";

export default function LogoutPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [status, setStatus] = useState<string>(t.auth.logout);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://linkyt-backend-fqz7hu-60dfe2-46-224-236-78.traefik.me";

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const token = sessionStorage.getItem("token");

                if (token) {
                    // Appel à l'API pour invalider le token côté serveur
                    await fetch(`${apiBase}/auth/logout`, {
                        method: "POST",
                        headers: buildAuthHeaders(),
                    });
                }

                // Nettoyer le sessionStorage
                sessionStorage.removeItem("user_id");
                sessionStorage.removeItem("username");
                sessionStorage.removeItem("email");
                sessionStorage.removeItem("token");

                setStatus(t.auth.logoutSuccess);

                // Rediriger vers la page de login après 1 seconde
                setTimeout(() => {
                    router.push("/auth/login");
                }, 1000);
            } catch (error) {
                console.error(t.error.generic, error);

                // Même en cas d'erreur, nettoyer le sessionStorage
                sessionStorage.removeItem("user_id");
                sessionStorage.removeItem("username");
                sessionStorage.removeItem("email");
                sessionStorage.removeItem("token");

                setStatus(t.auth.logoutComplete);
                setTimeout(() => {
                    router.push("/auth/login");
                }, 1000);
            }
        };

        handleLogout();
    }, [router, apiBase]);

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
            {/* Sélecteur de langue */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes glitch {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `
            }} />

            {/* Grille cyberpunk en fond */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Effet scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #FFD700 2px, #FFD700 4px)',
                }}
            />

            {/* Contenu principal */}
            <div className="relative z-10 text-center">
                <div className="mb-8">
                    <div className="inline-block">
                        <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                             style={{ animation: 'spin 1s linear infinite' }}
                        />
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-4"
                    style={{
                        color: '#FFD700',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)',
                        fontFamily: 'monospace'
                    }}>
                    {t.auth.logoutTitle}
                </h1>

                <p className="text-xl mb-8"
                   style={{
                       color: '#FFD700',
                       fontFamily: 'monospace',
                       animation: 'pulse 1.5s ease-in-out infinite'
                   }}>
                    {status}
                </p>

                <div className="flex justify-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" style={{ animation: 'pulse 0.5s ease-in-out infinite' }} />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" style={{ animation: 'pulse 0.5s ease-in-out 0.2s infinite' }} />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" style={{ animation: 'pulse 0.5s ease-in-out 0.4s infinite' }} />
                </div>
            </div>

            {/* Lignes de glitch aléatoires */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
                <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
            </div>
        </div>
    );
}
