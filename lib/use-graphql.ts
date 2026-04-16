import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth-utils";

const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

interface UseGraphQLOptions<T> {
    /** The GraphQL query/mutation string */
    query: string;
    /** Variables for the query */
    variables?: Record<string, unknown>;
    /** Skip initial fetch (for mutations or conditional queries) */
    skip?: boolean;
    /** Require auth token */
    requireAuth?: boolean;
    /** Transform the data before setting state */
    transform?: (data: Record<string, unknown>) => T;
}

interface UseGraphQLResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: (variables?: Record<string, unknown>) => Promise<T | null>;
    execute: (variables?: Record<string, unknown>) => Promise<T | null>;
}

/**
 * Lightweight GraphQL hook that wraps fetch with auth headers.
 * Use this as a stepping stone toward full Apollo migration.
 * Each page can replace its inline fetch() calls with this hook.
 */
export function useGraphQL<T = Record<string, unknown>>({
    query,
    variables,
    skip = false,
    requireAuth = true,
    transform,
}: UseGraphQLOptions<T>): UseGraphQLResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(
        async (overrideVars?: Record<string, unknown>): Promise<T | null> => {
            setLoading(true);
            setError(null);

            try {
                const token = getAccessToken();
                if (requireAuth && !token) {
                    setError("Not authenticated");
                    return null;
                }

                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const response = await fetch(GQL_URL, {
                    method: "POST",
                    headers,
                    credentials: "include",
                    body: JSON.stringify({
                        query,
                        variables: overrideVars ?? variables,
                    }),
                });

                const result = await response.json();

                if (result.errors) {
                    const msg = result.errors[0]?.message || "GraphQL error";
                    setError(msg);
                    return null;
                }

                const finalData = transform
                    ? transform(result.data)
                    : (result.data as T);
                setData(finalData);
                return finalData;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Network error";
                setError(message);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [query, variables, requireAuth, transform]
    );

    useEffect(() => {
        if (!skip) {
            execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]);

    return { data, loading, error, refetch: execute, execute };
}
