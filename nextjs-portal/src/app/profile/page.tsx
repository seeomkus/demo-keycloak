import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function fetchBackendProfile() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3088";
  const cookie = h.get("cookie") ?? "";
  const res = await fetch(`http://${host}/api/backend/profile`, {
    headers: { cookie },
    cache: "no-store",
  });
  return { status: res.status, body: await res.json() };
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const backend = await fetchBackendProfile();

  const s = session as typeof session & { issuer?: string; username?: string };

  // Only safe, non-sensitive identity claims are rendered here.
  // Deliberately NOT shown: client secret, raw access token, refresh token,
  // or any other credential — per the demo's mandatory security rules.
  const claims: Array<[string, string | undefined]> = [
    ["Username", s.username],
    ["Email", session.user?.email ?? undefined],
    ["Name", session.user?.name ?? undefined],
    ["Subject (sub)", session.user?.id],
    ["Issuer (iss)", s.issuer],
  ];

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Profile</h1>
      <p>Authenticated identity — safe claims only.</p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {claims.map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "0.5rem", fontWeight: 600 }}>{label}</td>
              <td style={{ padding: "0.5rem" }}>{value ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>FastAPI Backend Call (Phase 12)</h2>
      <p>
        This section is fetched server-side from <code>/api/backend/profile</code>, which
        attaches the Keycloak access token as <code>Authorization: Bearer &lt;token&gt;</code>{" "}
        when calling FastAPI at <code>:8089/api/profile</code>. The access token itself is
        never sent to this browser.
      </p>
      <pre style={{ background: "#f5f5f5", padding: "1rem", overflowX: "auto" }}>
        HTTP {backend.status}
        {"\n"}
        {JSON.stringify(backend.body, null, 2)}
      </pre>
    </main>
  );
}
