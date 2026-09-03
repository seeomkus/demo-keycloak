import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Next.js Admin</h1>
      <p>Demo SSO — second application, same realm (demo-sso) as the Portal.</p>

      {session ? (
        <>
          <p>
            Signed in as <strong>{session.user?.name ?? session.user?.email ?? "unknown"}</strong>
          </p>
          <p style={{ color: "#0a7a0a" }}>
            If you reached this page already authenticated without seeing a Keycloak login
            form, that is Single Sign-On working — your existing Keycloak session
            (established via the Portal) was recognized automatically.
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
