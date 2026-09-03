import { handlers } from "@/auth";

// Delegates GET/POST for /api/auth/* (signin, callback, signout, session, etc.)
// to Auth.js. This is the route registered as the client's Redirect URI
// in Keycloak: http://localhost:3088/api/auth/callback/keycloak
export const { GET, POST } = handlers;
