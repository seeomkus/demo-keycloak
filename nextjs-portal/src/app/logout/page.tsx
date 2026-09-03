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
        This ends the Portal&apos;s <em>application session</em> only. Depending on
        Keycloak&apos;s SSO session state, you may still be able to sign back in without
        re-entering credentials — this distinction is covered in Phase 16.
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
