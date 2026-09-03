"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

/**
 * Handles login/logout for the flow-demo page WITHOUT ever navigating
 * the main page away. Login opens a real popup window that performs
 * the genuine OIDC redirect to Keycloak (unavoidable — that's the whole
 * point of not letting the app see the password); once it reports
 * success via postMessage, this component calls router.refresh(),
 * which re-runs the page's server component (re-checks the real
 * session) without a full browser navigation or URL change.
 */
export default function AuthControls({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.source === "kc-popup" && e.data?.status === "success") {
        setBusy(false);
        router.refresh();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  function openLoginPopup() {
    setBusy(true);
    const w = 480;
    const h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(
      "/popup-login",
      "keycloak-login",
      `width=${w},height=${h},left=${left},top=${top}`
    );
    // Fallback: if the popup was blocked, stop the busy state.
    if (!popupRef.current) setBusy(false);
  }

  async function doLogout() {
    setBusy(true);
    await signOut({ redirect: false });
    setBusy(false);
    router.refresh();
  }

  if (authenticated) {
    return (
      <button onClick={doLogout} disabled={busy} style={btn("#f6f8fa", "#1f2328", "#d0d7de")}>
        {busy ? "Signing out…" : "Logout"}
      </button>
    );
  }

  return (
    <button onClick={openLoginPopup} disabled={busy} style={btn("#0969da", "#ffffff", "#0969da")}>
      {busy ? "Waiting for popup…" : "Login with Keycloak (popup)"}
    </button>
  );
}

function btn(bg: string, color: string, border: string) {
  return {
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: bg,
    color,
    cursor: "pointer",
  } as const;
}
