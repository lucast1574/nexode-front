import { getAccessToken, clearAuthSession } from "./auth-utils";

const GQL_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the refresh token.
 * Returns true if successful, false otherwise.
 */
async function refreshAccessToken(): Promise<boolean> {
    try {
        // The refresh_token cookie is sent automatically with credentials: 'include'
        // But we also support the localStorage fallback during migration
        const refreshToken =
            typeof window !== "undefined"
                ? localStorage.getItem("refresh_token")
                : null;

        if (!refreshToken) {
            // If no localStorage token, rely on HttpOnly cookie being sent automatically
            // Try the refresh mutation — the cookie will be included
        }

        const response = await fetch(GQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                query: `
                    mutation RefreshToken($token: String!) {
                        refreshToken(token: $token) {
                            success
                            access_token
                            refresh_token
                        }
                    }
                `,
                variables: { token: refreshToken || "" },
            }),
        });

        const result = await response.json();

        if (result.data?.refreshToken?.success) {
            // The backend sets new HttpOnly cookies automatically.
            // For backward compat, also store in localStorage/JS cookies:
            const { access_token, refresh_token } = result.data.refreshToken;
            if (access_token && typeof window !== "undefined") {
                const Cookies = (await import("js-cookie")).default;
                Cookies.set("access_token", access_token, { expires: 1 });
                localStorage.setItem("access_token", access_token);
            }
            if (refresh_token && typeof window !== "undefined") {
                const Cookies = (await import("js-cookie")).default;
                Cookies.set("refresh_token", refresh_token, { expires: 7 });
                localStorage.setItem("refresh_token", refresh_token);
            }
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Authenticated fetch wrapper with automatic token refresh on 401.
 * 
 * Usage:
 *   const result = await gqlFetch(query, variables);
 *   if (result.data) { ... }
 */
export async function gqlFetch<T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>
): Promise<{ data: T | null; errors?: Array<{ message: string; extensions?: Record<string, unknown> }> }> {
    const doFetch = async () => {
        const token = getAccessToken();
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
            body: JSON.stringify({ query, variables }),
        });

        return response.json();
    };

    let result = await doFetch();

    // Check if we got an authentication error
    const isAuthError =
        result.errors?.some(
            (e: { extensions?: { code?: string } }) =>
                e.extensions?.code === "UNAUTHENTICATED" ||
                e.extensions?.code === "FORBIDDEN"
        ) ?? false;

    if (isAuthError) {
        // Prevent multiple simultaneous refresh attempts
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        const refreshed = await (refreshPromise ?? Promise.resolve(false));

        if (refreshed) {
            // Retry the original request with the new token
            result = await doFetch();
        } else {
            // Refresh failed — clear session and redirect to login
            clearAuthSession();
            if (typeof window !== "undefined") {
                window.location.href = "/auth/login";
            }
        }
    }

    return result;
}
