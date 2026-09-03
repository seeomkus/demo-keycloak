import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

/**
 * NextAuth (Auth.js) configuration for the Next.js Admin app.
 *
 * Uses the SAME Keycloak server and the SAME realm (demo-sso) as the
 * Portal app (Phase 8), but its OWN registered client (nextjs-admin,
 * Phase 14). This is the setup that makes Single Sign-On observable in
 * Phase 15: one Keycloak, one realm, two independent clients, one
 * shared browser SSO session.
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
   * Custom cookie names, prefixed per-app — see the matching comment in
   * the Portal's src/auth.ts. Without this, this Admin app (:3089) and
   * the Portal (:3088) would both write a host-only "authjs.session-token"
   * cookie for the "localhost" domain (cookies are NOT port-scoped),
   * silently overwriting each other's session and causing
   * "no matching decryption secret" / JWTSessionError once the app that
   * "lost" tries to decrypt a cookie encrypted with the other app's
   * AUTH_SECRET.
   */
  cookies: {
    sessionToken: { name: "admin-authjs.session-token" },
    callbackUrl: { name: "admin-authjs.callback-url" },
    csrfToken: { name: "admin-authjs.csrf-token" },
    pkceCodeVerifier: { name: "admin-authjs.pkce.code_verifier" },
    state: { name: "admin-authjs.state" },
    nonce: { name: "admin-authjs.nonce" },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.subject = profile?.sub;
        token.issuer = account.issuer ?? process.env.KEYCLOAK_ISSUER;
        token.preferredUsername =
          (profile as { preferred_username?: string } | undefined)?.preferred_username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = typeof token.subject === "string" ? token.subject : undefined;
      (session as unknown as { issuer?: string; username?: string }).issuer =
        typeof token.issuer === "string" ? token.issuer : undefined;
      (session as unknown as { issuer?: string; username?: string }).username =
        typeof token.preferredUsername === "string" ? token.preferredUsername : undefined;
      return session;
    },
  },
});
