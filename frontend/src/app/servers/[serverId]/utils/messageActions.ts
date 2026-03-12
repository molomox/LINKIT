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
