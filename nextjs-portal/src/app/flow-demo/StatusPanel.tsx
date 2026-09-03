"use client";

import { useEffect, useState } from "react";

interface ServiceState {
  key: string;
  label: string;
  port: string;
  up: boolean | null; // null = checking
  ms: number | null;
}

const INITIAL: ServiceState[] = [
  { key: "portal", label: "Next.js Portal", port: "3088", up: true, ms: 0 }, // we're on it
  { key: "keycloak", label: "Keycloak", port: "8088", up: null, ms: null },
  { key: "fastapi", label: "FastAPI", port: "8089", up: null, ms: null },
  { key: "admin", label: "Next.js Admin", port: "3089", up: null, ms: null },
];

/** Live reachability indicator for every service this demo depends on.
 * Checked on mount and on manual refresh — surfaces exactly the kind of
 * problem that otherwise only shows up as "the popup didn't work" with
 * no explanation (e.g. the Admin app not having been started yet). */
export default function StatusPanel() {
  const [services, setServices] = useState<ServiceState[]>(INITIAL);
  const [checking, setChecking] = useState(false);

  async function checkAll() {
    setChecking(true);
    setServices((prev) => prev.map((s) => (s.key === "portal" ? s : { ...s, up: null })));

    // Keycloak + FastAPI: checked server-side (they're not directly
    // browser-reachable from a different-origin fetch reliably in all setups).
    try {
      const started = performance.now();
      const res = await fetch("/api/backend/status", { cache: "no-store" });
      const data = await res.json();
      setServices((prev) =>
        prev.map((s) => {
          if (s.key === "keycloak") return { ...s, up: data.keycloak.up, ms: data.keycloak.ms };
          if (s.key === "fastapi") return { ...s, up: data.fastapi.up, ms: data.fastapi.ms };
          return s;
        })
      );
      void started;
    } catch {
      setServices((prev) =>
        prev.map((s) => (s.key === "keycloak" || s.key === "fastapi" ? { ...s, up: false, ms: null } : s))
      );
    }

    // Admin app: pinged directly from the browser. A cross-origin
    // fetch with mode "no-cors" resolves on ANY successful connection
    // (even though we can't read the response body/status), and
    // throws/rejects if the connection is refused — exactly what we
    // need for a simple up/down check.
    //
    // Uses the SAME hostname the browser used to reach this Portal
    // page (window.location.hostname), not a hardcoded "localhost" —
    // "localhost" from a LAN client's browser means that client's own
    // machine, not this server, so a hardcoded value always failed
    // when opened from another computer even though Admin was
    // genuinely running fine.
    const adminStarted = performance.now();
    const adminUrl = `http://${window.location.hostname}:3089`;
    try {
      await fetch(adminUrl, { mode: "no-cors", cache: "no-store", signal: AbortSignal.timeout(3000) });
      setServices((prev) =>
        prev.map((s) => (s.key === "admin" ? { ...s, up: true, ms: Math.round(performance.now() - adminStarted) } : s))
      );
    } catch {
      setServices((prev) => prev.map((s) => (s.key === "admin" ? { ...s, up: false, ms: null } : s)));
    }

    setChecking(false);
  }

  useEffect(() => {
    checkAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        flexWrap: "wrap",
        marginTop: "0.8rem",
        fontSize: "0.88rem",
      }}
    >
      {services.map((s) => (
        <div
          key={s.key}
          title={s.up === false ? `${s.label} is not reachable on :${s.port} — start it first` : `${s.label} :${s.port}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.3rem 0.75rem",
            borderRadius: 999,
            border: `1px solid ${s.up === null ? "#d0d7de" : s.up ? "#1a7f37" : "#cf222e"}`,
            background: s.up === null ? "#f6f8fa" : s.up ? "#dafbe1" : "#ffebe9",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: s.up === null ? "#8c959f" : s.up ? "#1a7f37" : "#cf222e",
              animation: s.up === null ? "blink 1s ease-in-out infinite" : undefined,
            }}
          />
          <span style={{ fontWeight: 600, color: "#1f2328" }}>{s.label}</span>
          <span style={{ color: "#57606a" }}>:{s.port}</span>
          {s.up === false && <span style={{ color: "#cf222e", fontWeight: 600 }}>down</span>}
        </div>
      ))}
      <button
        onClick={checkAll}
        disabled={checking}
        style={{
          fontSize: "0.82rem",
          border: "1px solid #d0d7de",
          background: "#ffffff",
          borderRadius: 6,
          padding: "0.25rem 0.7rem",
          cursor: checking ? "default" : "pointer",
          color: "#1f2328",
        }}
      >
        {checking ? "Checking…" : "↻ Recheck"}
      </button>
      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
