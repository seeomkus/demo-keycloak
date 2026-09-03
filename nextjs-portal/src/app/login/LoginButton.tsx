"use client";

import { signIn } from "next-auth/react";

/**
 * Client component using next-auth/react's signIn — NOT a Server Action
 * calling the server-side signIn(). A Server Action that redirects to
 * an external URL (Keycloak's authorization endpoint) hits a real
 * Next.js/Auth.js interaction quirk: the PKCE code_verifier cookie set
 * during the action's response isn't reliably readable back at the
 * callback, producing "InvalidCheck: pkceCodeVerifier value could not
 * be parsed" — found while testing the equivalent page on the Admin
 * app. The client-side signIn() call does a plain browser navigation
 * instead, which doesn't have this problem.
 */
export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("keycloak", { callbackUrl: "/profile" })}
      style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
    >
      Login with Keycloak
    </button>
  );
}
