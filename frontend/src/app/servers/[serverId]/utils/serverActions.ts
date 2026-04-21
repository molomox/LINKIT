import { buildAuthHeaders } from "@/utils/authHeaders";

function getFrontendBaseUrl(): string {
    const configuredBase = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "");
    if (configuredBase) {
        return configuredBase;
    }

    if (typeof window !== "undefined") {
        const { origin, protocol } = window.location;
        if (protocol === "http:" || protocol === "https:") {
            return origin.replace(/\/$/, "");
        }
    }

    return "http://localhost:3001";
}

export async function leaveServer(serverId: string, apiBase: string): Promise<void> {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) throw new Error("Utilisateur non identifié");

    const res = await fetch(`${apiBase}/servers/${serverId}/leave`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
        body: JSON.stringify(userId),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
}

export async function deleteServer(serverId: string, apiBase: string): Promise<void> {
    const res = await fetch(`${apiBase}/servers/${serverId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
}

export function copyInviteLink(inviteCode: string): void {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    try {
        const textarea = document.createElement("textarea");
        textarea.value = inviteLink;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    } catch (e) {
        console.error("Copie échouée", e);
    }
}

export type DmChannelResponse = {
    channel_id: string;
    user_id: string;
    username: string;
    server_id: string;
};

export async function createOrGetDmChannel(
    serverId: string,
    targetUserId: string,
    apiBase: string,
): Promise<DmChannelResponse> {
    const currentUserId = sessionStorage.getItem("user_id");
    if (!currentUserId) {
        throw new Error("Utilisateur non identifié");
    }

    const res = await fetch(`${apiBase}/servers/${serverId}/dm/${targetUserId}`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ user_id: currentUserId }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    return res.json();
}

export async function listDmChannels(
    serverId: string,
    userId: string,
    apiBase: string,
): Promise<DmChannelResponse[]> {
    const res = await fetch(`${apiBase}/servers/${serverId}/dm/user/${userId}`, {
        method: "GET",
        headers: buildAuthHeaders(),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    return res.json();
}
