import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Logout</h1>
      <p>
        This ends the Admin app&apos;s <em>application session</em> only — the underlying
        Keycloak SSO session (and the Portal&apos;s own session) may remain active. See
        Phase 16 for the full distinction and a true full logout.
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
          Confirm Logout
        </button>
      </form>
    </main>
  );
}
