import { useCallback, useEffect, useState } from "react";
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

    useEffect(() => {
        const loadAvailableReactions = async () => {
            try {
                const data = await messageActions.listAvailableReactions(apiBase);
                setAvailableReactions(data);
            } catch (error) {
                console.error("Erreur chargement des reactions:", error);
                onError?.(error);
            }
        };

        loadAvailableReactions();
    }, [apiBase, onError]);

    const handleToggleReaction = useCallback(
        async (messageId: string, reaction: Reaction) => {
            try {
                const status = await messageActions.toggleMessageReaction(
                    messageId,
                    reaction.reaction_id,
                    apiBase,
                );

                onMessagesUpdate((prev) =>
                    prev.map((message) => {
                        if (message.message_id !== messageId) {
                            return message;
                        }

                        const reactions = [...(message.reactions ?? [])];

                        if (status === "removed") {
                            const index = reactions.findIndex((r) => r.reaction_id === reaction.reaction_id);
                            if (index >= 0) {
                                reactions.splice(index, 1);
                            }
                        } else {
                            reactions.push(reaction);
                        }

                        return {
                            ...message,
                            reactions,
                        };
                    }),
                );
            } catch (error) {
                onError?.(error);
            }
        },
        [apiBase, onMessagesUpdate, onError],
    );

    return {
        availableReactions,
        handleToggleReaction,
    };
}
