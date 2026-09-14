import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const config = {
    matcher: ["/", "/admin/:path*", "/profile/:path*", "/directory/:path*"],
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

    // A temporary (join-request approval) or reset (gabay-issued) password
    // locks the member out of every gated route except the page that lets
    // them set a real one - checked from the JWT claim (not a DB call, since
    // this runs on the edge) so it takes effect the moment they log in.
    if (session.mustChangePassword && request.nextUrl.pathname !== "/change-password") {
        return NextResponse.redirect(new URL("/change-password", request.url));
    }

    return NextResponse.next();
}
