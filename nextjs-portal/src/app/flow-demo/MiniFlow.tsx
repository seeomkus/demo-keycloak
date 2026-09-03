"use client";

/** A tiny horizontal flow diagram — purely visual, showing the request
 * path a single live check actually takes (browser -> Portal -> FastAPI
 * -> etc). Rendered inline under each check in LiveChecks.tsx so the
 * exact route of that specific request is obvious at a glance. */
export default function MiniFlow({ steps }: { steps: string[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.3rem",
        marginTop: "0.5rem",
      }}
    >
      {steps.map((step, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#1f2328",
              background: "#ffffff",
              border: "1px solid #d0d7de",
              borderRadius: 6,
              padding: "0.15rem 0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            {step}
          </span>
          {i < steps.length - 1 && <span style={{ color: "#8c959f", fontSize: "0.78rem" }}>→</span>}
        </span>
      ))}
    </div>
  );
}
