import { useState, useCallback, useRef } from "react";

/**
 * Hook to prevent double-clicks on action buttons (deploy, restart, delete).
 * Returns a wrapper function that locks the action for a cooldown period.
 */
export function useActionLock(cooldownMs = 3000) {
    const [isLocked, setIsLocked] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const execute = useCallback(
        async <T>(action: () => Promise<T>): Promise<T | null> => {
            if (isLocked) return null;

            setIsLocked(true);
            try {
                return await action();
            } finally {
                timerRef.current = setTimeout(() => {
                    setIsLocked(false);
                }, cooldownMs);
            }
        },
        [isLocked, cooldownMs]
    );

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsLocked(false);
    }, []);

    return { isLocked, execute, reset };
}
