"use client";

export interface FlowStep {
  label: string;
  detail: string;
  done: boolean;
  current: boolean;
}

/**
 * Purely a visual stepper — but every `done`/`current` value it receives
 * is computed server-side from the REAL Auth.js session for this request
 * (see page.tsx). Nothing here decides on its own whether a step is
 * complete; it only renders the real state it was given.
 */
export default function FlowStepper({ steps }: { steps: FlowStep[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "1rem 0 1.4rem" }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.6rem 1rem",
              borderRadius: 10,
              border: `1px solid ${step.done ? "#1a7f37" : step.current ? "#0969da" : "#d0d7de"}`,
              background: step.done ? "#dafbe1" : step.current ? "#ddf4ff" : "#f6f8fa",
              transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
              minWidth: 165,
            }}
          >
            <span
              style={{
                width: 23,
                height: 23,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                flexShrink: 0,
                background: step.done ? "#1a7f37" : step.current ? "#0969da" : "#8c959f",
                color: "#ffffff",
                animation: step.current ? "pulse 1.6s ease-in-out infinite" : undefined,
              }}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1f2328" }}>{step.label}</div>
              <div style={{ fontSize: "0.8rem", color: "#57606a" }}>{step.detail}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <span style={{ color: steps[i + 1].done || steps[i + 1].current ? "#1a7f37" : "#d0d7de", fontSize: "1.1rem" }}>
              →
            </span>
          )}
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(9,105,218,0.35); }
          50% { box-shadow: 0 0 0 6px rgba(9,105,218,0); }
        }
      `}</style>
    </div>
  );
}
