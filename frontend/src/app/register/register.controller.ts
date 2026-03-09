import { useState } from "react";
import { useRouter } from "next/navigation";

export type RegisterResponse = {
    username: string;
    user_id: string;
    email: string;
    create_at: string;
};

export type RegisterFormData = {
    username: string;
    email: string;
    password: string;
};

export const useRegisterController = () => {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [result, setResult] = useState<RegisterResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    /**
     * Envoie la requête d'inscription au backend
     */
    const registerUser = async (formData: RegisterFormData): Promise<RegisterResponse> => {
        console.log("🔵 Envoi de la requête à:", `${apiBase}/auth/signup`);
        console.log("🔵 Données:", { username: formData.username, password: "***", email: formData.email });

        const response = await fetch(`${apiBase}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        console.log("🔵 Status de la réponse:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("🔴 Erreur backend:", errorText);
            throw new Error(errorText);
        }

        const data = (await response.json()) as RegisterResponse;
        console.log("✅ Utilisateur créé:", data);
        return data;
    };

    /**
     * Gère la soumission du formulaire
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("Enregistrement en cours...");
        setResult(null);
        setIsLoading(true);

        try {
            const data = await registerUser({ username, email, password });

            setResult(data);
            setStatus("Inscription réussie ! Redirection...");

            // Réinitialiser le formulaire
            setUsername("");
            setEmail("");
            setPassword("");

            // Rediriger après 2 secondes
            setTimeout(() => {
                navigateToLogin();
            }, 2000);
        } catch (error) {
            console.error("🔴 Erreur:", error);
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
            setStatus(`Erreur: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Navigation vers la page de login
     */
    const navigateToLogin = () => {
        router.push("/auth/login");
    };

    return {
        // États
        username,
        email,
        password,
        status,
        result,
        isLoading,

        // Actions
        setUsername,
        setEmail,
        setPassword,
        handleSubmit,
        navigateToLogin,
    };
};
