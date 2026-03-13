export async function deleteMessage(messageId: string, apiBase: string): Promise<void> {
    const currentUserId = sessionStorage.getItem("user_id");

    const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
}

export async function updateMessage(messageId: string, newContent: string, apiBase: string): Promise<void> {
    const currentUserId = sessionStorage.getItem("user_id");

    const res = await fetch(`${apiBase}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: newContent,
            user_id: currentUserId,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
}

export type ApiReaction = {
    reaction_id: number;
    emoji: string;
    reaction_name: string;
};

export async function listAvailableReactions(apiBase: string): Promise<ApiReaction[]> {
    const res = await fetch(`${apiBase}/reactions`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    return res.json();
}

export async function toggleMessageReaction(
    messageId: string,
    reactionId: number,
    apiBase: string,
): Promise<"added" | "removed"> {
    const currentUserId = sessionStorage.getItem("user_id");

    const res = await fetch(`${apiBase}/messages/${messageId}/reactions/${reactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    const payload = await res.json().catch(() => null);
    const status = payload?.status;
    if (status === "added" || status === "removed") {
        return status;
    }

    return "added";
}
