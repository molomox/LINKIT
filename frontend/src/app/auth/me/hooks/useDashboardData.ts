"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as serverActions from "../../../servers/[serverId]/utils/serverActions";
import type { DmConversation, Server, ServerApiResponse, UserProfile } from "../types";

type UseDashboardDataArgs = {
    apiBase: string;
};

export function useDashboardData({ apiBase }: UseDashboardDataArgs) {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [servers, setServers] = useState<Server[]>([]);
    const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadUserData = async () => {
            try {
                const userId = sessionStorage.getItem("user_id");
                const storedUsername = sessionStorage.getItem("username");
                const storedEmail = sessionStorage.getItem("email");

                if (!userId) {
                    router.push("/auth/login");
                    return;
                }

                const userRes = await fetch(`${apiBase}/me?user_id=${userId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!isMounted) return;

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser({
                        username: userData.username,
                        email: userData.email,
                        user_id: userData.user_id,
                        create_at: userData.create_at,
                    });
                } else {
                    setUser({
                        username: storedUsername || "User",
                        email: storedEmail || "user@nightcity.net",
                        user_id: userId,
                        create_at: new Date().toISOString(),
                    });
                }

                const serversRes = await fetch(`${apiBase}/servers?user_id=${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!isMounted) return;

                if (serversRes.ok) {
                    const serversData = await serversRes.json();
                    const normalizedServers = serversData.map((server: ServerApiResponse) => ({
                        id: server.server_id,
                        name: server.name,
                        memberCount: 0,
                    }));
                    setServers(normalizedServers);

                    const dmResults = await Promise.allSettled(
                        normalizedServers.map((server: Server) =>
                            serverActions.listDmChannels(server.id, userId, apiBase).then((channels) =>
                                channels.map((dm) => ({
                                    ...dm,
                                    server_name: server.name,
                                })),
                            ),
                        ),
                    );

                    const mergedDms = dmResults
                        .filter((r): r is PromiseFulfilledResult<DmConversation[]> => r.status === "fulfilled")
                        .flatMap((r) => r.value);

                    setDmConversations(mergedDms);
                } else {
                    setServers([]);
                }

                setLoading(false);
            } catch {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadUserData();

        return () => {
            isMounted = false;
        };
    }, [apiBase, router]);

    return {
        user,
        servers,
        dmConversations,
        loading,
    };
}
