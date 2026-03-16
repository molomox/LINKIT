"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RequireAuthProps = {
    children: React.ReactNode;
};

function clearSession() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user_id");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("email");
}

export default function RequireAuth({ children }: RequireAuthProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = sessionStorage.getItem("token");
            const userId = sessionStorage.getItem("user_id");
            const ok = !!token && !!userId;

            if (!ok) {
                clearSession();
                setAuthorized(false);
                router.replace("/auth/login");
                return;
            }

            setAuthorized(true);
        };

        checkAuth();
        const interval = window.setInterval(checkAuth, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
                <div className="text-yellow-400 font-bold" style={{ fontFamily: "monospace" }}>
                    Verifying session...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
