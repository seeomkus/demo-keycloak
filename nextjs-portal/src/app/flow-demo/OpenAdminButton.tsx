"use client";

/** Opens the Admin app (a genuinely separate application on :3089) in a
 * popup window rather than navigating this page away — the point of
 * this button is to prove SSO while staying on /flow-demo the whole time. */
export default function OpenAdminButton() {
  function open() {
    const w = 460;
    const h = 620;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    // Use the SAME hostname the browser used to reach this Portal page,
    // not a hardcoded "localhost" -- from a LAN client, "localhost"
    // means that client's own machine, not the server running Admin.
    const adminUrl = `http://${window.location.hostname}:3089`;
    window.open(adminUrl, "admin-app-sso", `width=${w},height=${h},left=${left},top=${top}`);
  }

  return (
    <button
      onClick={open}
      style={{
        padding: "0.6rem 1.2rem",
        fontSize: "1rem",
        fontWeight: 600,
        borderRadius: 8,
        border: "1px solid #1a7f37",
        background: "#1a7f37",
        color: "#ffffff",
        cursor: "pointer",
      }}
    >
      Open Admin App (:3089) in popup →
    </button>
  );
}
