import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const s = session as typeof session & { issuer?: string; username?: string };

  // Same rule as the Portal: only safe identity claims rendered here.
  const claims: Array<[string, string | undefined]> = [
    ["Username", s.username],
    ["Email", session.user?.email ?? undefined],
    ["Name", session.user?.name ?? undefined],
    ["Subject (sub)", session.user?.id],
    ["Issuer (iss)", s.issuer],
  ];

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Profile — Admin</h1>
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
    </main>
  );
}
