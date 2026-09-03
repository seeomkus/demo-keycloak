import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Next.js Portal</h1>
      <p>Demo SSO — Next.js + Keycloak (OIDC / OAuth 2.0)</p>

      {session ? (
        <>
          <p>
            Signed in as <strong>{session.user?.name ?? session.user?.email ?? "unknown"}</strong>
          </p>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link href="/profile">Profile</Link>
            <Link href="/logout">Logout</Link>
          </nav>
        </>
      ) : (
        <>
          <p>You are not signed in.</p>
          <Link href="/login">Login</Link>
        </>
      )}
    </main>
  );
}
