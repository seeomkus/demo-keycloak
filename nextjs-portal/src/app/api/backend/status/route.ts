import { NextResponse } from "next/server";

/** Server-side reachability check for Keycloak and FastAPI (both are
 * only reachable from the Next.js server in this network layout, not
 * necessarily from the browser). Used by StatusPanel to show which
 * services are actually up before the user clicks anything. */
async function ping(url: string): Promise<{ up: boolean; ms: number | null; status?: number }> {
  const started = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    return { up: res.status < 500, ms: Date.now() - started, status: res.status };
  } catch {
    return { up: false, ms: null };
  }
}

export async function GET() {
  const keycloakUrl = process.env.KEYCLOAK_ISSUER
    ? process.env.KEYCLOAK_ISSUER.replace(/\/realms\/.*$/, "")
    : "http://localhost:8088";
  const fastapiUrl = process.env.FASTAPI_BASE_URL ?? "http://localhost:8089";

  const [keycloak, fastapi] = await Promise.all([
    ping(keycloakUrl),
    ping(`${fastapiUrl}/api/public`),
  ]);

  return NextResponse.json({ keycloak, fastapi });
}
