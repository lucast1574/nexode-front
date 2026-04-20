import Cookies from "js-cookie";
import { User } from "./types";

/**
 * Store auth session data.
 * 
 * SECURITY MODEL:
 * - access_token and refresh_token are now set as HttpOnly cookies by the backend.
 *   The frontend CANNOT read them (immune to XSS).
 * - We still store the `user` object in localStorage for UI display.
 * - A non-HttpOnly `has_session` cookie is set by the backend so the frontend
 *   and middleware can check "is user logged in?" without accessing the token.
 * - For backward compatibility during migration, we still accept tokens
 *   and set them as JS-accessible cookies (the backend HttpOnly cookies take priority).
 */
export const setAuthSession = (accessToken?: string, refreshToken?: string, user?: User) => {
    // During migration: still set JS cookies for backward compat with existing fetch() calls
    // These will be phased out once all pages use credentials: 'include'
    if (accessToken) {
        Cookies.set("access_token", accessToken, {
            expires: 1, // 1 day (access tokens are short-lived)
            secure: window.location.protocol === 'https:',
            sameSite: 'lax',
        });
        // Keep localStorage ONLY during migration phase — remove once fully migrated
        localStorage.setItem("access_token", accessToken);
    }
    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, {
            expires: 7,
            secure: window.location.protocol === 'https:',
            sameSite: 'lax',
        });
        localStorage.setItem("refresh_token", refreshToken);
    }
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
};

export const clearAuthSession = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("has_session");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
};

/**
 * Sign out from the server and clear local session.
 * This triggers the backend to clear HttpOnly cookies.
 */
export const signOutFromServer = async (): Promise<boolean> => {
    try {
        const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api-v1/graphql";
        const mutation = `mutation SignOutUser { signOutUser { success message } }`;

        console.log("[Auth] Attempting server sign-out...");
        
        // We use fetch with credentials include to ensure the backend receives
        // and can subsequently clear the HttpOnly tokens.
        await fetch(GQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: mutation }),
            credentials: "include",
        });

        clearAuthSession();
        return true;
    } catch (error) {
        console.error("[Auth] Sign out error:", error);
        // Fallback: clear local session anyway so the user isn't stuck
        clearAuthSession();
        return false;
    }
};

export const getAuthUser = (): User | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

/**
 * Get the access token for API calls.
 * Priority: HttpOnly cookie (checked server-side) > JS cookie > localStorage
 * Note: The HttpOnly cookie is NOT readable here — it's sent automatically
 * with fetch() when credentials: 'include' is used.
 */
export const getAccessToken = (): string | null => {
    if (typeof window === "undefined") return null;
    // JS-accessible cookie (backward compat) or localStorage fallback
    return Cookies.get("access_token") || localStorage.getItem("access_token");
};

/**
 * Check if user has an active session.
 * Uses the `has_session` cookie set by the backend (not HttpOnly, safe to read).
 */
export const hasActiveSession = (): boolean => {
    if (typeof window === "undefined") return false;
    return Cookies.get("has_session") === "1" || !!getAccessToken();
};

export const getAuthRedirectPath = (user: User | null): string => {
    if (!user) return "/auth/login";
    return "/dashboard";
};
