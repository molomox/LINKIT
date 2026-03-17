"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type NotifParams = {
    title: string;
    body?: string;
    tag?: string;
    onClick?: () => void;
};

export function useDesktopNotifications() {
    const notifiedTagRef = useRef<Set<string>>(new Set());
    const storageKey = "desktop_notifications_enabled";
    const isTauriRuntime =
        typeof window !== "undefined" &&
        ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

    const isSupported =
        isTauriRuntime || (typeof window !== "undefined" && "Notification" in window);

    const [permission, setPermission] = useState<NotificationPermission>(
        isSupported ? Notification.permission : "denied"
    );
    const [enabled, setEnabled] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(storageKey);
        if (stored === null) return true;
        return stored === "true";
    });

    const refreshPermission = useCallback(async () => {
        console.log('[DEBUG] refreshPermission called');
        if (!isSupported) {
            setPermission("denied");
            return;
        }

        if (isTauriRuntime) {
            try {
                const { isPermissionGranted } = await import("@tauri-apps/plugin-notification");
                const granted = await isPermissionGranted();
                setPermission(granted ? "granted" : "default");
                return;
            } catch {
                setPermission("denied");
                return;
            }
        }

        setPermission(Notification.permission);
    }, [isSupported, isTauriRuntime]);

    useEffect(() => {
        console.log('[DEBUG] useEffect refreshPermission, isSupported:', isSupported);
        void refreshPermission();

        if (!isSupported) return;

        const handleStateUpdate = () => {
            void refreshPermission();
        };
        window.addEventListener("focus", handleStateUpdate);
        document.addEventListener("visibilitychange", handleStateUpdate);

        return () => {
            window.removeEventListener("focus", handleStateUpdate);
            document.removeEventListener("visibilitychange", handleStateUpdate);
        };
    }, [isSupported, refreshPermission]);

    useEffect(() => {
        console.log('[DEBUG] enabled changed:', enabled);
        if (typeof window === "undefined") return;
        window.localStorage.setItem(storageKey, String(enabled));
    }, [enabled]);

    const requestPermission = useCallback(async () => {
        console.log('[DEBUG] requestPermission called');
        if (!isSupported) return "denied" as NotificationPermission;
        if (isTauriRuntime) {
            try {
                const { requestPermission: tauriRequestPermission } = await import("@tauri-apps/plugin-notification");
                const result = await tauriRequestPermission();
                const normalized =
                    result === "granted" || result === "denied"
                        ? result
                        : "default";
                setPermission(normalized);
                if (normalized === "granted") {
                    setEnabled(true);
                }
                return normalized as NotificationPermission;
            } catch {
                setPermission("denied");
                return "denied" as NotificationPermission;
            }
        }

        if (Notification.permission === "granted") {
            setPermission("granted");
            setEnabled(true);
            return "granted" as NotificationPermission;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
            setEnabled(true);
        }
        return result;
    }, [isSupported, isTauriRuntime]);

    const toggleEnabled = useCallback(() => {
        console.log('[DEBUG] toggleEnabled called, permission:', permission);
        if (!isSupported || permission !== "granted") return;
        setEnabled((prev) => !prev);
    }, [isSupported, permission]);

    const notify = useCallback(
        ({ title, body, tag, onClick }: NotifParams) => {
            console.log('[DEBUG] notify called', { title, body, tag, enabled, permission, isSupported, isTauriRuntime });
            if (!isSupported) {
                console.log('[DEBUG] notify: not supported');
                return;
            }
            if (!enabled) {
                console.log('[DEBUG] notify: not enabled');
                return;
            }
            if (permission !== "granted") {
                console.log('[DEBUG] notify: permission not granted');
                return;
            }
            // Affiche la notification même si la page est visible

            if (tag && notifiedTagRef.current.has(tag)) {
                console.log('[DEBUG] notify: tag already notified', tag);
                return;
            }
            if (tag) {
                notifiedTagRef.current.add(tag);
                setTimeout(() => notifiedTagRef.current.delete(tag), 0);
            }
            if (isTauriRuntime) {
                console.log('[DEBUG] notify: Tauri runtime');
                void import("@tauri-apps/plugin-notification")
                    .then(({ sendNotification }) => {
                        sendNotification({ title, body: body ?? "" });
                    })
                    .catch(() => {
                        console.log('[DEBUG] notify: Tauri plugin unavailable');
                    });
                return;
            }

            console.log('[DEBUG] notify: Web notification');
            const n = new Notification(title, { body, tag });
            n.onclick = () => {
                window.focus();
                onClick?.();
                n.close();
            };
        },
        [isSupported, enabled, permission, isTauriRuntime]
    );

    return {
        isSupported,
        permission,
        enabled,
        requestPermission,
        refreshPermission,
        toggleEnabled,
        notify,
    };
}