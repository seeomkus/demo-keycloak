import { handlers } from "@/auth";

// Redirect URI registered on the nextjs-admin client (Phase 14):
// http://localhost:3089/api/auth/callback/keycloak
export const { GET, POST } = handlers;
