"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

/**
 * This page only ever runs inside the POPUP window opened by the
 * flow-demo page's Login button. On mount it immediately triggers the
 * real OIDC redirect to Keycloak — inside the popup only, so the main
 * /flow-demo window/tab never navigates away.
 */
export default function PopupLoginPage() {
  useEffect(() => {
    signIn("keycloak", { redirectTo: "/popup-callback?status=success" });
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: "2rem", textAlign: "center", color: "#57606a" }}>
      Redirecting to Keycloak…
    </div>
  );
}
