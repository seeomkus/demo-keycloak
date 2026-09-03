import { safeAuth } from "@/auth";
import FlowStepper, { FlowStep } from "./FlowStepper";
import LiveChecks from "./LiveChecks";
import AuthControls from "./AuthControls";
import OpenAdminButton from "./OpenAdminButton";
import InfoPanel from "./InfoPanel";
import StatusPanel from "./StatusPanel";
import MiniFlow from "./MiniFlow";

/**
 * A single-page, LIVE demonstration of the real SSO flow built in this
 * project. Every piece of state on this page — whether you're logged
 * in, what claims your session carries, whether FastAPI accepted your
 * token — comes from the actual running Keycloak, Next.js, and FastAPI
 * services. Nothing here is scripted or faked.
 *
 * This page itself never navigates or reloads: login happens in a
 * popup window (see AuthControls.tsx), and the SSO check for the Admin
 * app also opens in a popup — the URL and scroll position of this page
 * never change.
 */
export default async function FlowDemoPage() {
  const session = await safeAuth();
  const authenticated = !!session;
  const s = session as typeof session & { issuer?: string; username?: string };

  const steps: FlowStep[] = [
    { label: "1. Open Portal", detail: "localhost:3088", done: true, current: false },
    {
      label: "2. Login via Keycloak",
      detail: authenticated ? "Session active" : "Not authenticated yet",
      done: authenticated,
      current: !authenticated,
    },
    {
      label: "3. Verify with FastAPI",
      detail: authenticated ? "Live checks below" : "Requires login",
      done: false,
      current: authenticated,
    },
    {
      label: "4. Try SSO on Admin app",
      detail: authenticated ? "Open Admin in a popup →" : "Requires login",
      done: false,
      current: false,
    },
  ];

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        padding: "1.6rem 2.5rem",
        width: "100%",
        color: "#1f2328",
        background: "#ffffff",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#cf222e",
              background: "#ffebe9",
              padding: "0.2rem 0.6rem",
              borderRadius: 999,
              marginBottom: "0.4rem",
            }}
          >
            🔴 Live — real Keycloak, real FastAPI, real PostgreSQL
          </span>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>SSO Flow — Live Demo</h1>
        </div>
        <p style={{ color: "#57606a", fontSize: "0.95rem", margin: 0, maxWidth: 380, textAlign: "right" }}>
          One page, no reloads. Login and the Admin-app SSO check open in popup windows.
        </p>
      </div>

      <StatusPanel />
      <InfoPanel />

      <FlowStepper steps={steps} />

      {/* Wide 3-column layout instead of stacking sections downward */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr 320px",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        {/* --- Column 1: Identity --- */}
        <section style={cardStyle}>
          <h2 style={cardTitle}>Identity</h2>
          {authenticated ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
                <tbody>
                  <Row label="Username" value={s.username} />
                  <Row label="Email" value={session?.user?.email ?? undefined} />
                  <Row label="Name" value={session?.user?.name ?? undefined} />
                  <Row label="Subject" value={session?.user?.id} />
                  <Row label="Issuer" value={s.issuer} />
                </tbody>
              </table>
              <MiniFlow
                steps={["Login popup", "Keycloak", "Token exchange (server)", "Session cookie", "Identity shown"]}
              />
            </>
          ) : (
            <>
              <p style={{ fontSize: "0.95rem", color: "#57606a" }}>
                Not signed in. Login opens a real Keycloak OIDC redirect — inside a popup window
                only.
              </p>
              <MiniFlow steps={["Click Login", "Popup → Keycloak", "Enter credentials", "Session created"]} />
            </>
          )}
          <div style={{ marginTop: "0.9rem" }}>
            <AuthControls authenticated={authenticated} />
          </div>
        </section>

        {/* --- Column 2: Live backend checks --- */}
        <section style={cardStyle}>
          <h2 style={cardTitle}>Live Backend Verification</h2>
          <p style={{ fontSize: "0.9rem", color: "#57606a", margin: "0 0 0.7rem" }}>
            Real fetch calls, right now, through this Portal&apos;s Backend-for-Frontend routes
            to the real FastAPI service.
          </p>
          <LiveChecks authenticated={authenticated} />
        </section>

        {/* --- Column 3: SSO call to action --- */}
        <section style={cardStyle}>
          <h2 style={cardTitle}>Try Real SSO</h2>
          {authenticated ? (
            <>
              <p style={{ fontSize: "0.95rem", color: "#57606a" }}>
                You&apos;re logged in here on the Portal. Open the Admin app — it{" "}
                <strong>will not ask for your password again</strong> if Keycloak still
                recognizes your session.
              </p>
              <MiniFlow
                steps={["Portal session", "Open Admin popup", "Keycloak recognizes session", "Admin logged in — no password"]}
              />
              <div style={{ marginTop: "0.9rem" }}>
                <OpenAdminButton />
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: "0.95rem", color: "#57606a" }}>Log in first, then this unlocks.</p>
              <MiniFlow steps={["Login to Portal", "Then: Admin popup", "Keycloak checks session"]} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  return (
    <tr style={{ borderBottom: "1px solid #eaeef2" }}>
      <td style={{ padding: "0.4rem 0", fontWeight: 600, width: "38%", color: "#1f2328" }}>{label}</td>
      <td style={{ padding: "0.4rem 0", color: "#1f2328", wordBreak: "break-word" }}>{value ?? "—"}</td>
    </tr>
  );
}

const cardStyle = {
  border: "1px solid #d0d7de",
  borderRadius: 10,
  padding: "1.1rem 1.2rem",
  background: "#f6f8fa",
} as const;

const cardTitle = { margin: "0 0 0.6rem", fontSize: "1.08rem", color: "#1f2328" } as const;
