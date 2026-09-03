"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Lands here (inside the popup) after Keycloak redirects back and
 * Auth.js finishes the token exchange. Immediately tells the opener
 * window (the real /flow-demo page) that login succeeded, then closes
 * itself. The opener never navigates — it just re-reads its session.
 */
function Inner() {
  const params = useSearchParams();
  const status = params.get("status") ?? "success";

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ source: "kc-popup", status }, window.location.origin);
    }
    const t = setTimeout(() => window.close(), 250);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem", textAlign: "center", color: "#57606a" }}>
      ✅ Signed in — this window will close automatically…
    </div>
  );
}

export default function PopupCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
