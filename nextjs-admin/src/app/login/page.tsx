"use client";

import { signIn } from "next-auth/react";

/**
 * Client component using next-auth/react's signIn — NOT a Server Action
 * calling the server-side signIn(). A Server Action that redirects to
 * an external URL (Keycloak's authorization endpoint) hits a real
 * Next.js/Auth.js interaction quirk: the PKCE code_verifier cookie set
 * during the action's response isn't reliably readable back at the
 * callback, producing "InvalidCheck: pkceCodeVerifier value could not
 * be parsed" — found while testing this exact page. The client-side
 * signIn() call below does a plain browser navigation instead, which
 * doesn't have this problem (this is also the pattern the Portal's
 * popup-login flow already uses successfully).
 */
export default function LoginPage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Login</h1>
      <p>
        Redirects to the same Keycloak realm (<code>demo-sso</code>) used by the Portal,
        via this app&apos;s own client, <code>nextjs-admin</code>.
      </p>
      <button
        onClick={() => signIn("keycloak", { callbackUrl: "/profile" })}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
      >
        Login with Keycloak
      </button>
    </main>
  );
}
