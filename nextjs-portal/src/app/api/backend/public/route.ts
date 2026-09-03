import { NextResponse } from "next/server";

/**
 * Proxies FastAPI's unauthenticated /api/public endpoint through the
 * Portal server. Same Backend-for-Frontend pattern as /api/backend/profile
 * (Phase 12) — the browser only ever talks to the Next.js server, never
 * directly to FastAPI, keeping the architecture consistent even for
 * endpoints that don't require a token.
 */
export async function GET() {
  const fastapiUrl = process.env.FASTAPI_BASE_URL ?? "http://localhost:8089";
  const started = Date.now();
  try {
    const res = await fetch(`${fastapiUrl}/api/public`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json({ ...body, __durationMs: Date.now() - started }, { status: res.status });
  } catch {
    return NextResponse.json({ error: "FastAPI unreachable" }, { status: 502 });
  }
}
