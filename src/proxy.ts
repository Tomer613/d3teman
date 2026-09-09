import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const config = {
    matcher: ["/admin/:path*", "/profile/:path*", "/directory/:path*"],
};

export async function proxy(request: NextRequest) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && !ADMIN_ROLES.has(session.role)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}
