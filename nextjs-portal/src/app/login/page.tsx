import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/profile");
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Login</h1>
      <p>
        Clicking below starts the OIDC Authorization Code Flow: you are redirected to
        Keycloak, log in there, and are returned here with an authenticated session.
      </p>
      <LoginButton />
    </main>
  );
}
