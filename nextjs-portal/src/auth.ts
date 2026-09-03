import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

/**
 * NextAuth (Auth.js) configuration for the Next.js Portal.
 *
 * Uses the Keycloak provider, which implements the OIDC Authorization
 * Code Flow: the browser is redirected to Keycloak's authorization
 * endpoint, the user logs in there, Keycloak redirects back with an
 * authorization code, and this server exchanges that code for tokens
 * at Keycloak's token endpoint. Tokens are never exposed to the browser
 * directly — only the resulting session cookie is.
 *
 * All secrets (client secret, NextAuth secret) are read from
 * environment variables — never hardcoded here.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  /**
   * Custom cookie names, prefixed per-app. Without this, the Portal
   * (:3088) and Admin (:3089) apps would both write a host-only cookie
   * literally named "authjs.session-token" for the "localhost" domain
   * — cookies are NOT port-scoped, so whichever app wrote last would
   * silently overwrite the other's cookie in the browser. Because each
   * app has its own AUTH_SECRET, the app that "loses" then fails to
   * decrypt the other's cookie ("no matching decryption secret" /
   * JWTSessionError). Namespacing the cookie name per app avoids the
   * collision entirely — see Phase 16's cross-port cookie finding.
   */
  cookies: {
    sessionToken: { name: "portal-authjs.session-token" },
    callbackUrl: { name: "portal-authjs.callback-url" },
    csrfToken: { name: "portal-authjs.csrf-token" },
    pkceCodeVerifier: { name: "portal-authjs.pkce.code_verifier" },
    state: { name: "portal-authjs.state" },
    nonce: { name: "portal-authjs.nonce" },
  },
  callbacks: {
    /**
     * Persist the Keycloak access token, ID token, and expiry into the
     * server-side JWT session so /profile can display safe claims and
     * later phases (Phase 12) can attach the access token as a Bearer
     * token when calling FastAPI.
     */
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        token.subject = profile?.sub;
        token.issuer = account.issuer ?? process.env.KEYCLOAK_ISSUER;
        token.preferredUsername =
          (profile as { preferred_username?: string } | undefined)?.preferred_username;
      }
      return token;
    },
    async session({ session, token }) {
      // Only expose safe identity fields to the client — never raw tokens.
      session.user.id = typeof token.subject === "string" ? token.subject : undefined;
      (session as unknown as { issuer?: string; username?: string }).issuer =
        typeof token.issuer === "string" ? token.issuer : undefined;
      (session as unknown as { issuer?: string; username?: string }).username =
        typeof token.preferredUsername === "string" ? token.preferredUsername : undefined;
      return session;
    },
  },
});

/**
 * A defensive wrapper around `auth()` for use in pages/components.
 * A stale or otherwise undecryptable session cookie (e.g. left over
 * from before the per-app cookie names above were introduced, or from
 * an AUTH_SECRET rotation) throws a JWTSessionError from inside
 * Auth.js rather than resolving to `null`. Treat that the same as "not
 * signed in" instead of letting it crash the page — a broken cookie
 * should never be worse than simply being logged out.
 */
export async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}
