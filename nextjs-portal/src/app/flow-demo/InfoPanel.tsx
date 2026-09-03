"use client";

import { useEffect, useState } from "react";

/** Trigger button + modal dialog explaining, in full detail, what this
 * live demo proves and how each part actually works. Closes on Escape,
 * backdrop click, or the × button. */
export default function InfoPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "#0969da",
          background: "#ddf4ff",
          border: "1px solid #54aeff",
          borderRadius: 999,
          padding: "0.4rem 1rem",
          marginTop: "0.8rem",
          cursor: "pointer",
        }}
      >
        ℹ️ What does this demo actually do?
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31,35,40,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-modal-title"
            style={{
              background: "#ffffff",
              borderRadius: 12,
              maxWidth: 720,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              color: "#1f2328",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#ffffff",
                borderBottom: "1px solid #d0d7de",
                padding: "1rem 1.3rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 1,
              }}
            >
              <h2 id="info-modal-title" style={{ margin: 0, fontSize: "1.25rem" }}>
                ℹ️ What does this demo actually do?
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "#f6f8fa",
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  fontSize: "1.15rem",
                  cursor: "pointer",
                  color: "#57606a",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "1.2rem 1.4rem 1.6rem", fontSize: "0.97rem", lineHeight: 1.68 }}>
              <p>
                This page is a <strong>live</strong>, single-page demonstration that Keycloak can
                act as a single Identity Provider for multiple independent applications. Every
                action here talks to the same real Keycloak, FastAPI, and PostgreSQL services
                the rest of this project is built on — nothing is scripted or faked.
              </p>

              <h3 style={h3}>The setup behind this page</h3>
              <ul style={ul}>
                <li>
                  <strong>One Keycloak</strong>, one realm (<code>demo-sso</code>), running
                  natively on <code>localhost:8088</code>, backed by PostgreSQL.
                </li>
                <li>
                  <strong>Two separate client applications</strong> registered in that same
                  realm: this Portal (<code>nextjs-portal</code>, port 3088) and a separate Admin
                  app (<code>nextjs-admin</code>, port 3089) — used in step 4 to prove SSO.
                </li>
                <li>
                  <strong>One shared user</strong> (<code>demo.user</code>) that can log into
                  either app without re-entering credentials, once authenticated with Keycloak.
                </li>
                <li>
                  <strong>FastAPI</strong> on port 8089, backed by its own PostgreSQL database
                  (<code>demo_app_db</code>) — fully independent of Keycloak&apos;s own database.
                </li>
              </ul>

              <h3 style={h3}>Step 1 — Open Portal</h3>
              <p>
                Just confirms you&apos;re viewing this Next.js application. This step is always
                marked done; every other step depends on what happens next.
              </p>

              <h3 style={h3}>Step 2 — Login via Keycloak</h3>
              <p>
                Clicking <strong>Login with Keycloak</strong> opens a real popup window. Inside
                that popup — and only there — the browser is redirected to Keycloak&apos;s actual
                login page. Your username and password are typed on <code>localhost:8088</code>,
                never inside this application. After Keycloak verifies your credentials, it
                issues an authorization code, which this Portal&apos;s server exchanges for an ID
                Token and Access Token over a direct server-to-server request (never visible in
                the browser). The popup then posts a success message back to this page and closes
                itself — this tab never navigates or reloads.
              </p>

              <h3 style={h3}>Step 3 — Verify with FastAPI (Live Backend Verification)</h3>
              <p>Once logged in, this page fires three real HTTP requests, in order:</p>
              <ol style={ol}>
                <li>
                  <strong>Public endpoint</strong> — no token required, should always succeed.
                </li>
                <li>
                  <strong>Protected endpoint</strong> — the Portal&apos;s server attaches your
                  real Keycloak Access Token as an <code>Authorization: Bearer</code> header when
                  calling FastAPI. FastAPI independently validates that token&apos;s signature,
                  issuer, and expiration against Keycloak before responding.
                </li>
                <li>
                  <strong>Database read</strong> — FastAPI queries live rows from{" "}
                  <code>demo_app_db</code> in PostgreSQL and returns them, proving the whole chain
                  from browser → Portal → FastAPI → database actually works.
                </li>
              </ol>
              <p>
                Each result shown is the exact HTTP status code, response time, and JSON body
                returned at that moment — you can click <strong>Re-run live checks</strong> at any
                time to repeat all three.
              </p>

              <h3 style={h3}>Step 4 — Try Real SSO</h3>
              <p>
                Opens the separate Admin app in another popup. Because Keycloak already
                remembers your session from step 2, the Admin app authenticates you{" "}
                <strong>without ever asking for a password</strong> — that is Single Sign-On,
                demonstrated live rather than described.
              </p>

              <h3 style={h3}>Security details worth knowing</h3>
              <ul style={ul}>
                <li>
                  The Access Token and ID Token are kept entirely on the Portal&apos;s server —
                  they are never sent to or readable by this page&apos;s client-side JavaScript.
                </li>
                <li>
                  FastAPI is only ever called through this Portal&apos;s own backend routes
                  (a Backend-for-Frontend pattern) — your browser never talks to FastAPI or
                  Keycloak directly for token exchange.
                </li>
                <li>
                  Logging out on this page ends only this Portal&apos;s own session. Keycloak&apos;s
                  underlying SSO session may still be active — try Step 4 again after logging out
                  to see that distinction for yourself.
                </li>
              </ul>

              <h3 style={h3}>Why nothing on this page navigates away</h3>
              <p>
                Login and the Admin-app SSO check both open in popup windows on purpose, so this
                tab&apos;s URL and scroll position never change. When a popup finishes its job, it
                posts a message back and this page silently re-checks its own session — no full
                page reload, no navigation.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const h3 = { fontSize: "1.03rem", margin: "1.1rem 0 0.4rem", color: "#0969da" } as const;
const ul = { margin: "0 0 0.6rem", paddingLeft: "1.2rem", display: "grid", gap: "0.35rem" } as const;
const ol = { margin: "0 0 0.6rem", paddingLeft: "1.2rem", display: "grid", gap: "0.35rem" } as const;
