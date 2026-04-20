import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";

export type SignupResponse = {
    username: string;
    user_id: string;
    email: string;
    create_at: string;
};

export const useSignupController = () => {
    const router = useRouter();
    const { t } = useTranslation();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [result, setResult] = useState<SignupResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL ??  "http://linkyt-backend-fqz7hu-60dfe2-46-224-236-78.traefik.me";

    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => {
                router.push("/auth/login");
            }, 2000);

            return () => clearTimeout(timer);
        }
        return undefined;
    }, [result, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(t.auth.loading);
        setResult(null);
        setIsLoading(true);

        console.log("Envoi de la requete a:", `${apiBase}/auth/signup`);
        console.log("Donnees:", { username, password: "***", email });

        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email }),
            });

            console.log("Status de la reponse:", res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error("Erreur backend:", errText);

                if (errText.includes("nom d'utilisateur est deja pris") || errText.includes("existe deja")) {
                    setStatus(` ${t.auth.userExists}`);
                } else if (errText.includes("email est deja utilise")) {
                    setStatus(` ${t.auth.emailExists}`);
                } else {
                    setStatus(` ${t.error.generic}: ${errText}`);
                }
                return;
            }

            const data = (await res.json()) as SignupResponse;
            console.log("Utilisateur cree:", data);
            setResult(data);
            setStatus(t.auth.signupSuccess);
            setUsername("");
            setEmail("");
            setPassword("");
        } catch (error) {
            console.error("Erreur reseau:", error);
            setStatus(t.error.network.replace("{message}", error instanceof Error ? error.message : "Unknown"));
        } finally {
            setIsLoading(false);
        }
    };

    return {
        username,
        email,
        password,
        status,
        result,
        isLoading,
        setUsername,
        setEmail,
        setPassword,
        handleSubmit,
    };
};
