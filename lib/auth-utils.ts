import Cookies from "js-cookie";
import { User } from "./types";

export const setAuthSession = (accessToken?: string, refreshToken?: string, user?: User) => {
    if (accessToken) {
        Cookies.set("access_token", accessToken, { expires: 7, secure: true, sameSite: 'strict' });
    }
    if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, { expires: 30, secure: true, sameSite: 'strict' });
    }
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
};

export const clearAuthSession = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    localStorage.removeItem("user");
};

export const getAuthUser = () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};
