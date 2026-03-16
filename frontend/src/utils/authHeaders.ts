export function getSessionToken(): string {
    const token = sessionStorage.getItem("token");
    if (!token) {
        throw new Error("Missing session token");
    }
    return token;
}

export function buildAuthHeaders(includeContentType = true): Record<string, string> {
    const token = getSessionToken();
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}
