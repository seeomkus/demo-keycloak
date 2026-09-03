import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

/**
 * Backend-for-Frontend proxy: the browser calls this Next.js route with
 * its own session cookie only. This route reads the Keycloak access
 * token server-side directly from the encrypted session JWT (via
 * next-auth/jwt's getToken) and attaches it as a Bearer token when
 * calling FastAPI.
 *
 * Deliberately NOT using the `session` object returned by `auth()`/
 * `useSession()` for this: any field placed on that session object is
 * serialized to the browser via GET /api/auth/session, which would leak
 * the access token to client-side JavaScript. getToken() reads the
 * encrypted cookie directly on the server and never exposes it to the
 * client-facing session API.
 */
export async function GET(req: NextRequest) {
  const started = Date.now();
  // Must match the custom cookie name configured in src/auth.ts
  // ("portal-authjs.session-token", not getToken's default
  // "authjs.session-token") -- that rename was made to stop the Portal
  // and Admin apps' session cookies from colliding on "localhost"
  // (cookies aren't port-scoped). Without this, getToken() silently
  // looks for the wrong cookie and always returns null, even for a
  // genuinely logged-in session.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: "portal-authjs.session-token",
  });

  if (!token) {
    return NextResponse.json({ error: "Not authenticated with the Portal" }, { status: 401 });
  }

  const accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "No access token available in session" }, { status: 401 });
  }

  const fastapiUrl = process.env.FASTAPI_BASE_URL ?? "http://localhost:8089";

  const res = await fetch(`${fastapiUrl}/api/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const body = await res.json();
  return NextResponse.json({ ...body, __durationMs: Date.now() - started }, { status: res.status });
}
