export async function leaveServer(serverId: string, apiBase: string): Promise<void> {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) throw new Error("Utilisateur non identifié");

    const res = await fetch(`${apiBase}/servers/${serverId}/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
}

export function copyInviteLink(inviteCode: string): void {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
}
