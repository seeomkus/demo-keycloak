"use client";

import { useEffect, useState } from "react";
import MiniFlow from "./MiniFlow";

type CheckStatus = "idle" | "running" | "ok" | "error";

interface CheckResult {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  flow: string[];
  status: CheckStatus;
  httpStatus?: number;
  durationMs?: number;
  body?: unknown;
}

const CHECK_DEFS: Array<{ key: string; label: string; description: string; endpoint: string; flow: string[] }> = [
  {
    key: "public",
    label: "1. FastAPI — public endpoint",
    description: "No token attached. Should succeed for anyone.",
    endpoint: "/api/backend/public",
    flow: ["Browser", "Portal proxy", "FastAPI"],
  },
  {
    key: "profile",
    label: "2. FastAPI — protected endpoint",
    description: "Portal attaches your real Keycloak access token as a Bearer header, server-side.",
    endpoint: "/api/backend/profile",
    flow: ["Browser", "Portal (attach token)", "FastAPI", "Keycloak (validate via JWKS)"],
  },
  {
    key: "products",
    label: "3. FastAPI — read PostgreSQL data",
    description: "FastAPI reads live rows from demo_app_db, independent of Keycloak's own database.",
    endpoint: "/api/backend/products",
    flow: ["Browser", "Portal proxy", "FastAPI", "PostgreSQL (demo_app_db)"],
  },
];

/**
 * Runs REAL fetch requests, in this browser, against this Next.js
 * server's own Backend-for-Frontend routes — which in turn call the
 * real FastAPI service. Nothing here is simulated: the HTTP status,
 * timing, and JSON body shown are exactly what the live services
 * returned at the moment the button was clicked.
 */
export default function LiveChecks({ authenticated }: { authenticated: boolean }) {
  const [results, setResults] = useState<CheckResult[]>(
    CHECK_DEFS.map((d) => ({ ...d, status: "idle" }))
  );
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults((prev) => prev.map((r) => ({ ...r, status: "running", body: undefined })));

    for (const def of CHECK_DEFS) {
      const started = performance.now();
      try {
        const res = await fetch(def.endpoint, { cache: "no-store" });
        const body = await res.json();
        const clientDuration = Math.round(performance.now() - started);
        setResults((prev) =>
          prev.map((r) =>
            r.key === def.key
              ? {
                  ...r,
                  status: res.ok ? "ok" : "error",
                  httpStatus: res.status,
                  durationMs: typeof body.__durationMs === "number" ? body.__durationMs : clientDuration,
                  body,
                }
              : r
          )
        );
      } catch {
        setResults((prev) =>
          prev.map((r) => (r.key === def.key ? { ...r, status: "error", httpStatus: 0 } : r))
        );
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    setRunning(false);
  }

  useEffect(() => {
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  return (
    <div>
      <button
        onClick={runAll}
        disabled={running}
        style={{
          padding: "0.45rem 1rem",
          fontSize: "0.92rem",
          fontWeight: 600,
          borderRadius: 6,
          border: "1px solid #d0d7de",
          background: running ? "#f6f8fa" : "#ffffff",
          color: "#1f2328",
          marginBottom: "0.8rem",
          cursor: running ? "default" : "pointer",
        }}
      >
        {running ? "Running…" : "▶ Re-run live checks"}
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {results.map((r) => (
          <div
            key={r.key}
            style={{
              border: "1px solid #d0d7de",
              borderRadius: 8,
              padding: "0.75rem 0.95rem",
              background: r.status === "ok" ? "#dafbe1" : r.status === "error" ? "#ffebe9" : "#f6f8fa",
              transition: "background 0.4s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <strong style={{ fontSize: "0.92rem", color: "#1f2328" }}>{r.label}</strong>
              <StatusBadge status={r.status} httpStatus={r.httpStatus} />
            </div>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "#57606a" }}>
              {r.description}
              {!authenticated && r.key === "profile" && (
                <span style={{ color: "#9a6700" }}> (expect 401 — not logged in)</span>
              )}
            </p>
            <MiniFlow steps={r.flow} />
            {r.durationMs !== undefined && (
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#8c959f" }}>
                {r.endpoint} · {r.durationMs}ms
              </p>
            )}
            {r.body !== undefined && (
              <pre
                style={{
                  marginTop: "0.45rem",
                  background: "#ffffff",
                  border: "1px solid #eaeef2",
                  padding: "0.55rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  overflowX: "auto",
                  color: "#1f2328",
                }}
              >
                {JSON.stringify(r.body, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, httpStatus }: { status: CheckStatus; httpStatus?: number }) {
  const map: Record<CheckStatus, { text: string; color: string }> = {
    idle: { text: "Waiting", color: "#8c959f" },
    running: { text: "Running…", color: "#9a6700" },
    ok: { text: `HTTP ${httpStatus}`, color: "#1a7f37" },
    error: { text: `HTTP ${httpStatus ?? "ERR"}`, color: "#cf222e" },
  };
  const s = map[status];
  return (
    <span
      style={{
        fontSize: "0.78rem",
        fontWeight: 700,
        color: s.color,
        border: `1px solid ${s.color}`,
        borderRadius: 999,
        padding: "0.08rem 0.6rem",
        whiteSpace: "nowrap",
      }}
    >
      {s.text}
    </span>
  );
}
