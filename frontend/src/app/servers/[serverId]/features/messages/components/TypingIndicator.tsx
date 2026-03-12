"use client";
import { useTranslation } from "@/i18n";

type TypingIndicatorProps = {
    typingUsers: Set<string>;
};

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
    const { t } = useTranslation();
    
    if (typingUsers.size === 0) return null;

    return (
        <div className="px-4 py-2 border-t border-yellow-400/20 bg-black/40">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-yellow-400/70 text-xs" style={{ fontFamily: 'monospace' }}>
                    {typingUsers.size > 1 
                        ? t.message.typingMultiple.replace('{users}', Array.from(typingUsers).join(', '))
                        : t.message.typing.replace('{users}', Array.from(typingUsers).join(', '))
                    }
                </span>
            </div>
        </div>
    );
}
