# Phase 12 — Next.js → FastAPI Integration

**Status:** ✅ Completed
**Date:** 2026-09-01

## Objective

Have the Next.js Portal call FastAPI using the Keycloak access token as a Bearer token, and verify all four authorization outcomes: no token, invalid token, expired token, and valid token.

## Architecture: Backend-for-Frontend (BFF)

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js Portal (:3088)
    participant F as FastAPI (:8089)
    participant K as Keycloak (:8088)

    B->>N: GET /profile (session cookie only)
    N->>N: getToken() — read encrypted JWT server-side
    N->>F: GET /api/profile\nAuthorization: Bearer <access_token>
    F->>K: Verify signature via JWKS
    F-->>N: 200 + safe claims
    N-->>B: Rendered page (no raw token included)
```

The browser never communicates directly with FastAPI, and never sees the access token. Next.js acts as the trusted intermediary that attaches the token server-side.

## Implementation

### `src/app/api/backend/profile/route.ts`

```ts
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Not authenticated with the Portal" }, { status: 401 });

  const accessToken = token.accessToken as string | undefined;
  if (!accessToken) return NextResponse.json({ error: "No access token available in session" }, { status: 401 });

  const res = await fetch(`${process.env.FASTAPI_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
```

### A Security Correction Made During Implementation

The first draft of this route read the access token from `auth()`'s `session` object. That was wrong: any field placed on the object returned by the `session` callback in `auth.ts` is serialized to the browser via `GET /api/auth/session` (used by client-side `useSession()`). Putting the access token there would have **leaked it to client-side JavaScript** — directly contradicting the principle already established in [Phase 8](phase-08-nextjs-portal.md) that raw tokens never reach the browser.

```mermaid
flowchart TD
    A["auth() → session object"] -->|serialized to browser via /api/auth/session| B[Client-side JS — NOT safe for tokens]
    C["getToken() — reads encrypted cookie directly"] -->|server-only, never serialized| D[Route Handler — safe for tokens]
```

The fix: use `getToken()` from `next-auth/jwt` inside the Route Handler instead. This reads the encrypted session JWT directly from the request's cookies, entirely on the server, and is never exposed through any client-facing API. `session()` callback continues to expose only safe identity fields (username, email, name, sub, issuer), as established in Phase 8.

### `/profile` Page Update

The page now also renders the result of calling `/api/backend/profile` server-side, demonstrating the full chain: browser → Next.js (session) → FastAPI (Bearer token) → back to browser as rendered HTML (never as a raw token).

## Test Scenarios

All four scenarios required by the master prompt were exercised end-to-end.

### 1. Without a Token

```bash
curl http://localhost:3088/api/backend/profile   # no session cookie
```

```json
{"error":"Not authenticated with the Portal"}
```
`401 Unauthorized` — the Portal itself refuses to call FastAPI without a session; FastAPI is never even reached.

### 2. Invalid Token

```bash
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.invalid.tampered" http://localhost:8089/api/profile
```

```json
{"detail":"Unknown signing key (kid) — token may be from a different realm/server"}
```
`401 Unauthorized`.

### 3. Expired Token

To produce a genuinely expired-but-validly-signed token quickly, the realm's `accessTokenLifespan` was **temporarily** set to 5 seconds and the `nextjs-portal` client's Direct Access Grants **temporarily** re-enabled (the same pattern used in [Phase 11](phase-11-fastapi.md)), a token was requested, confirmed to work immediately:

```json
{"message":"Token validated successfully.", "username":"demo.user", ...}
```
`200 OK`

...then, after waiting past its 5-second lifespan, the **same token** was retried:

```json
{"detail":"Invalid token: Signature has expired."}
```
`401 Unauthorized`.

Both settings were reverted immediately afterward:

```bash
./kcadm.bat update realms/demo-sso -s accessTokenLifespan=300
./kcadm.bat update clients/<nextjs-portal-uuid> -r demo-sso -s directAccessGrantsEnabled=false
```

### 4. Valid Token — Full Real Login

The complete Authorization Code Flow was exercised via `curl` (acting as a browser across all redirects) using the real `demo.user` credentials, establishing an actual Next.js session cookie. `GET /profile` was then requested with that cookie:

```text
HTTP 200
{
  "message": "Token validated successfully.",
  "username": "demo.user",
  "email": "demo.user@example.local",
  "name": "Demo User",
  "subject": "025dc481-252b-495c-87ba-1c5204ce1612",
  "issuer": "http://localhost:8088/realms/demo-sso"
}
```

## Result Summary

| Scenario | Response |
|---|---|
| No token | `401 Unauthorized` |
| Invalid token | `401 Unauthorized` |
| Expired token | `401 Unauthorized` |
| Valid token | `200 OK` |

## Why the Difference Matters

Each `401` case fails for a distinct, correctly-identified reason (missing header, unrecognized signing key, expired signature) — this specificity is what makes [Phase 17 — Troubleshooting](phase-17-troubleshooting.md) tractable: a vague blanket "401 Unauthorized" with no detail would leave a developer guessing which of several possible causes applies.

## Checkpoint

✅ Next.js Portal calls FastAPI with a Bearer access token via a secure Backend-for-Frontend route, with the access token never exposed to the browser. All four authorization outcomes (no token, invalid, expired, valid) verified against the real Keycloak-issued tokens and the real `demo.user` account. All temporary test configuration (short token lifespan, direct access grants) was reverted. Ready to proceed to [Phase 13 — PostgreSQL Application Database](phase-13-postgresql-application-database.md).
