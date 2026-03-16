import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, Reaction } from "../../../types";
import * as messageActions from "../../../utils/messageActions";

interface UseMessageReactionsProps {
    apiBase: string;
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void;
    onError?: (error: unknown) => void;
}

export function useMessageReactions({
    apiBase,
    onMessagesUpdate,
    onError,
}: UseMessageReactionsProps) {
    const [availableReactions, setAvailableReactions] = useState<Reaction[]>([]);
    const pendingTogglesRef = useRef<Set<string>>(new Set());
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        let isCancelled = false;

        const loadAvailableReactions = async () => {
            try {
                const data = await messageActions.listAvailableReactions(apiBase);

                if (isCancelled) {
                    return;
                }

                setAvailableReactions(data);
            } catch (error) {
                console.error("Erreur chargement des reactions:", error);
                onErrorRef.current?.(error);
            }
        };

        loadAvailableReactions();

        return () => {
            isCancelled = true;
        };
    }, [apiBase]);

    const handleToggleReaction = useCallback(
        async (messageId: string, reaction: Reaction) => {
            const toggleKey = `${messageId}:${reaction.reaction_id}`;
            if (pendingTogglesRef.current.has(toggleKey)) {
                return;
            }

            pendingTogglesRef.current.add(toggleKey);
            try {
                await messageActions.toggleMessageReaction(
                    messageId,
                    reaction.reaction_id,
                    apiBase,
                );
                // The definitive reaction state is applied from the WebSocket event.
            } catch (error) {
                onErrorRef.current?.(error);
            } finally {
                pendingTogglesRef.current.delete(toggleKey);
            }
        },
        [apiBase],
    );

    return {
        availableReactions,
        handleToggleReaction,
    };
}
