import { NextResponse, type NextRequest } from "next/server";

// Cheap gate: bounce signed-out visitors before rendering. Real checks happen in requireCreator().
export function middleware(req: NextRequest) {
  if (!req.cookies.has("caught_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
