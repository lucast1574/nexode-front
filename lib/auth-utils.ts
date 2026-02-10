import Cookies from "js-cookie";
import { User } from "./types";

export const setAuthSession = (accessToken?: string, refreshToken?: string, user?: User) => {
    if (accessToken) {
        Cookies.set("access_token", accessToken, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        localStorage.setItem("access_token", accessToken);
    }
    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, { expires: 30, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        localStorage.setItem("refresh_token", refreshToken);
    }
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
};

export const clearAuthSession = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
};

export const getAuthUser = () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

export const getAccessToken = () => {
    if (typeof window === "undefined") return null;
    return Cookies.get("access_token") || localStorage.getItem("access_token");
};

export const getAuthRedirectPath = (user: User | null): string => {
    if (!user) return "/auth/login";
    // If user has an active subscription that is NOT 'free', go to dashboard
    if (user.subscription?.status === 'ACTIVE' && user.subscription?.plan?.slug && user.subscription.plan.slug !== 'free') {
        return "/dashboard";
    }
    return "/checkout";
};
