import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

const publicPaths = ["/login", "/register", "/onboarding"];

const adminPaths = ["/admin"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "form-action 'self'",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  const csp = CSP_DIRECTIVES.join("; ");
  response.headers.set("Content-Security-Policy", csp);

  if (adminPaths.some((p) => pathname.startsWith(p))) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin(req.auth.user?.id)) {
      const url = new URL("/", req.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (publicPaths.includes(pathname) || pathname.startsWith("/api/")) {
    return response;
  }

  if (!req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next|api/auth|favicon.ico|manifest.json|icons/|sw.js|workbox-).*)"],
};

export const runtime = "nodejs";
