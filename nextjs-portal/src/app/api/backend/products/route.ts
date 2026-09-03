import { NextResponse } from "next/server";

/** Proxies FastAPI's GET /api/products through the Portal server — see
 * /api/backend/public for why this proxy pattern is used consistently. */
export async function GET() {
  const fastapiUrl = process.env.FASTAPI_BASE_URL ?? "http://localhost:8089";
  const started = Date.now();
  try {
    const res = await fetch(`${fastapiUrl}/api/products`, { cache: "no-store" });
    const body = await res.json();
    return NextResponse.json({ items: body, __durationMs: Date.now() - started }, { status: res.status });
  } catch {
    return NextResponse.json({ error: "FastAPI unreachable" }, { status: 502 });
  }
}
