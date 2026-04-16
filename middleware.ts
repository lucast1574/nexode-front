import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/checkout"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check both the HttpOnly access_token cookie and the has_session flag
    const hasToken = request.cookies.has("access_token");
    const hasSession = request.cookies.get("has_session")?.value === "1";
    const isAuthenticated = hasToken || hasSession;

    // Protected routes: redirect to login if no auth
    const isProtected = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    if (isProtected && !isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Auth routes: redirect to dashboard if already logged in
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/checkout/:path*",
        "/auth/:path*",
    ],
};
