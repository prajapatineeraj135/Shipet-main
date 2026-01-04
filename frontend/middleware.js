// /middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
    const token = request.cookies.get("token")?.value;
    const pathname = request.nextUrl.pathname;

    const isAuthPage =
        pathname === "/auth/login" ||
        pathname === "/auth/signup" ||
        pathname === "/auth/forgot-password" ||
        pathname === "/auth/reset-password" ||
        pathname === "/auth/verify-otp";

    const isProtectedRoute = pathname.startsWith("/dashboard");

    // 1. If no token and trying to access protected route → redirect to login
    if (!token && isProtectedRoute) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 2. If token exists and user is trying to visit login → redirect to dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // 3. Allow request to proceed
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|favicon.ico|.*\\..*).*)"],
};
