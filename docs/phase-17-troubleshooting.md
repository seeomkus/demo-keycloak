# Phase 17 — Troubleshooting

**Status:** ✅ Completed
**Date:** 2026-09-01

## Format

Every issue below follows:

```text
SYMPTOM → CAUSE → CHECK → FIX → VERIFY
```

Issues marked **"Encountered in this demo"** are not hypothetical — they were actually hit and resolved during earlier phases, with the resolution linked back to that phase's documentation.

---

## Keycloak does not start

**SYMPTOM:** `kc.bat start-dev` exits immediately or hangs without reaching "Listening on".
**CAUSE:** Usually one of: Java not found/incompatible, port already bound, or a bad `keycloak.conf` value (e.g. malformed `db-url`).
**CHECK:**
```powershell
java -version
Get-NetTCPConnection -LocalPort 8088
```
**FIX:** Install/point to a supported JDK ([Phase 1](phase-01-java.md)); free the port (see below); fix `conf/keycloak.conf` syntax.
**VERIFY:** `Invoke-WebRequest http://localhost:8088` returns `200`.

---

## Port 8088 / 3088 / 3089 / 8089 conflict

**SYMPTOM:** The relevant process fails to bind, or an unrelated app answers on that port.
**CAUSE:** Another process already listening on the same port.
**CHECK:**
```powershell
Get-NetTCPConnection -LocalPort 8088,3088,3089,8089 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
Get-Process -Id <OwningProcess>
```
**FIX:** Per the mandatory rules ([Phase 0](phase-00-environment-audit.md)): identify the conflicting process first, do not blindly change the port — decide whether to stop that process or, only if truly necessary, reassign the port consistently across every config file that references it (`keycloak.conf`, `.env.local`, `package.json` scripts, Keycloak client redirect URIs).
**VERIFY:** The intended service, and only that service, answers on the port.

---

## PostgreSQL connection refused

**SYMPTOM:** `psql: could not connect to server: Connection refused`, or FastAPI/Keycloak fail to start with a database connection error.
**CAUSE:** PostgreSQL service not running, wrong port, or `pg_hba.conf` rejecting the connection method.
**CHECK:**
```powershell
Get-Service -Name "postgresql*"
Get-NetTCPConnection -LocalPort 5432
```
```bash
psql -h 127.0.0.1 -p 5432 -U postgres -c "SELECT 1;"
```
**FIX:** Start the service (`Start-Service postgresql-x64-17`); confirm `pg_hba.conf` allows the connecting method (see [Phase 3](phase-03-postgresql.md) — this demo relies on `trust` for `127.0.0.1`, already present on this machine).
**VERIFY:** The `psql` test query above succeeds.

---

## Invalid redirect URI

**SYMPTOM:** Keycloak shows *"Invalid parameter: redirect_uri"* or *"We are sorry... Invalid redirect uri"*.
**CAUSE:** The URI the app is redirecting to does not exactly match a `redirectUris` entry registered on the Keycloak client ([Phase 7](phase-07-client-nextjs-portal.md) / [Phase 14](phase-14-nextjs-admin.md)) — a trailing slash, wrong port, or `http` vs `https` mismatch is enough.
**CHECK:**
```bash
./kcadm.bat get clients/<uuid> -r demo-sso -F redirectUris
```
Compare byte-for-byte against `AUTH_URL` / the app's actual callback path.
**FIX:** Correct either the client's `redirectUris` or the app's `AUTH_URL`/callback route so they match exactly. Avoid wildcards (per the mandatory rules) — fix the exact value instead of loosening the match.
**VERIFY:** The login redirect completes without the Keycloak error page.

---

## Invalid client

**SYMPTOM:** Keycloak shows *"We are sorry... Client not found"* or the token endpoint returns `invalid_client`.
**CAUSE:** Wrong `client_id`, wrong/rotated `client_secret`, or the client is disabled/deleted in the wrong realm.
**CHECK:**
```bash
./kcadm.bat get clients -r demo-sso -q clientId=nextjs-portal -F id,enabled
```
**FIX:** Confirm `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET` in `.env.local` match the current values in Keycloak, and that the app is pointed at the correct realm (`demo-sso`, not `master`).
**VERIFY:** Login proceeds past the credential-exchange step without `invalid_client`.

---

## Login loop

**SYMPTOM:** The browser bounces between the app and Keycloak repeatedly without ever landing on an authenticated page.
**CAUSE:** Typically a session cookie problem — the app cannot persist its own session (bad `AUTH_SECRET`, cookie blocked, or clock skew making the session look expired immediately), so every page load looks unauthenticated and re-triggers login.
**CHECK:** Inspect `Set-Cookie` headers on the callback response; confirm `AUTH_SECRET` is set and stable (not regenerated on every restart); check system clock drift between the app host and Keycloak host.
**FIX:** Set a fixed `AUTH_SECRET` in `.env.local` (already done in [Phase 8](phase-08-nextjs-portal.md)); ensure cookies aren't being blocked (`SameSite`/`Secure` mismatches on plain HTTP `localhost` are usually fine, but a proxy stripping cookies would break this); sync system clocks.
**VERIFY:** A single login attempt lands on the intended authenticated page without bouncing.

---

## Callback error

**SYMPTOM:** The redirect back from Keycloak shows an error instead of completing login (e.g. `access_denied`, `MissingCSRF`).
**CAUSE (encountered in this demo, Phase 8):** A raw `curl` POST to the sign-in endpoint without first fetching a CSRF token produced exactly `MissingCSRF`.
**CHECK:** Confirm the CSRF token was fetched from `/api/auth/csrf` and submitted alongside the sign-in request, with the CSRF cookie carried along.
**FIX:** Always initiate login through the normal browser flow (or, when scripting, fetch `/api/auth/csrf` first and reuse the same cookie jar for every subsequent request — see [Phase 8](phase-08-nextjs-portal.md)'s verification steps for the exact working sequence).
**VERIFY:** The callback completes and a session cookie is set.

---

## Cookie problem (same-hostname, different-port collision)

**SYMPTOM:** Logging into the Admin app appears to silently log out (or corrupt) the Portal's session, or vice versa, when tested with a shared cookie store.
**CAUSE (encountered in this demo, Phase 16):** Cookies are scoped by **hostname**, not by port. Two apps both served from `localhost` (ports 3088 and 3089) share the same cookie namespace for host-only cookies, so same-named session cookies (`authjs.session-token`) collide.
**CHECK:** Inspect the cookie jar/store — do both apps' session cookies share the same `Domain`/host with no port distinction?
**FIX:** This is expected browser behavior, not a bug to "fix" in code — in production, Portal and Admin should live on distinct subdomains (`portal.example.com`, `admin.example.com`), which naturally separates their cookies while still sharing the IdP's own domain cookie. For local multi-port testing, use separate browser profiles/incognito windows per app, or be aware of this collision when scripting tests (see [Phase 16](phase-16-logout.md)'s methodology).
**VERIFY:** Each app's session persists independently when tested from isolated cookie contexts.

---

## CORS

**SYMPTOM:** A browser console error like *"blocked by CORS policy"* when the frontend calls an API directly from client-side JavaScript.
**CAUSE:** The calling origin isn't in the target's allowed origins (`webOrigins` on the Keycloak client, or CORS middleware config on FastAPI).
**CHECK:** Browser DevTools Network tab — look for a missing `Access-Control-Allow-Origin` header on the response.
**FIX:** Add the exact calling origin to the relevant `webOrigins` ([Phase 7](phase-07-client-nextjs-portal.md)) or FastAPI's CORS middleware allow-list.
**NOTE:** This demo's architecture ([Phase 12](phase-12-nextjs-fastapi-integration.md)) avoids this class of bug entirely for the FastAPI call — the browser never calls FastAPI directly; only the Next.js server does, so there is no cross-origin browser request to begin with.
**VERIFY:** The request succeeds without a CORS error.

---

## 401 Unauthorized

**SYMPTOM:** An API call that should succeed returns `401`.
**CAUSE:** One of: missing `Authorization` header, malformed token, expired token, or wrong signing key — each produces `401` but for a different reason (verified explicitly in [Phase 12](phase-12-nextjs-fastapi-integration.md)).
**CHECK:** Read the `detail` field in FastAPI's JSON error response — this implementation deliberately returns a specific reason rather than a generic message (see [Phase 11](phase-11-fastapi.md)'s `jwt_auth.py`).
**FIX:** Match the fix to the specific cause — see the JWT-specific entries below.
**VERIFY:** `200` with the expected payload.

---

## JWT invalid

**SYMPTOM:** `401` with a signature or decoding error.
**CAUSE:** Token signed by a different key (wrong realm/server), token corrupted/truncated, or algorithm mismatch.
**CHECK:** Decode the header (without verifying) to inspect `kid` and `alg`; compare `kid` against Keycloak's current JWKS (`/realms/demo-sso/protocol/openid-connect/certs`).
**FIX:** Ensure the token actually came from `demo-sso` on this Keycloak instance; if Keycloak's signing keys were rotated, the resource server's JWKS cache (5-minute TTL in this implementation) will pick up new keys automatically within that window.
**VERIFY:** `200` with valid claims.

---

## Issuer mismatch

**SYMPTOM:** `401` — `"Invalid token: Invalid issuer"` (or similar).
**CAUSE:** The token's `iss` claim doesn't match `KEYCLOAK_ISSUER` configured on the resource server — e.g. token issued by `master` realm but validated against `demo-sso`, or `localhost` vs `127.0.0.1` mismatch.
**CHECK:** Decode the token and compare its `iss` claim to the exact `KEYCLOAK_ISSUER` value in FastAPI's `.env`.
**FIX:** Make both sides consistent — same hostname, same realm path, in both the token issuer and the validator's configured issuer.
**VERIFY:** `200`.

---

## Audience mismatch

**SYMPTOM:** Expecting `401` due to audience but getting inconsistent behavior, or confusion about why audience checks "don't work".
**CAUSE (encountered in this demo, Phase 11):** Keycloak's default access tokens in this realm carry `aud: "account"`, **not** the requesting client's `clientId` — the client identity is in `azp` instead.
**CHECK:** Decode a real token and inspect `aud` vs `azp`.
**FIX:** Validate `azp` against the expected client id when client-restriction is needed, rather than assuming `aud` equals the client id (see [Phase 11](phase-11-fastapi.md)'s documented design decision).
**VERIFY:** Tokens from the intended client are accepted; tokens from other clients (if `azp` checking is enabled) are rejected.

---

## Token expired

**SYMPTOM:** `401` — `"Signature has expired."`
**CAUSE:** The token's `exp` claim is in the past.
**CHECK:** Decode the token and compare `exp` to the current time.
**FIX:** The client must obtain a fresh token — either a new login (Authorization Code Flow) or, for a longer-lived session, a refresh token exchange. This demo deliberately reproduced this scenario in [Phase 12](phase-12-nextjs-fastapi-integration.md) by temporarily shortening `accessTokenLifespan` to 5 seconds.
**VERIFY:** A freshly obtained token succeeds; the old one still correctly returns `401`.

---

## FastAPI cannot validate JWT

**SYMPTOM:** Every token, even a freshly issued valid one, is rejected.
**CAUSE (encountered in this demo, Phase 11):** Keycloak 26's **lightweight access token** default strips profile claims (and can differ in shape from what the resource server expects); separately, a JWKS fetch failure (network issue, wrong `KEYCLOAK_JWKS_URL`) would cause every validation to fail with "Unknown signing key".
**CHECK:** Decode a real token to see which claims are actually present; independently curl the JWKS URL to confirm FastAPI can reach it.
**FIX:** For missing claims: disable lightweight tokens on the client (`access.token.lightweight.disabled=true`, as done in Phase 11) if the resource server needs profile claims directly in the access token. For JWKS fetch failures: confirm `KEYCLOAK_JWKS_URL` is reachable from FastAPI's network context.
**VERIFY:** `curl` to the JWKS URL succeeds, and a real access token now carries the expected claims.

---

## PostgreSQL connection error (application-level)

**SYMPTOM:** FastAPI's `/api/products` endpoints fail with a database error.
**CAUSE:** Wrong `DATABASE_URL`, wrong credentials, or the `app_user` account lacks privileges on `demo_app_db`.
**CHECK:**
```bash
PGPASSWORD=app_demo_pass psql -h 127.0.0.1 -U app_user -d demo_app_db -c "SELECT 1;"
```
**FIX:** Correct `DATABASE_URL` in `fastapi-app/.env`; re-grant privileges if needed (see [Phase 3](phase-03-postgresql.md)/[Phase 13](phase-13-postgresql-application-database.md)).
**VERIFY:** `GET /api/products` returns `200` with data.

---

## Checkpoint

✅ Every troubleshooting scenario listed in the master prompt documented in `SYMPTOM → CAUSE → CHECK → FIX → VERIFY` format, with several grounded in issues genuinely diagnosed and resolved earlier in this walkthrough (JAVA_HOME resolution in Phase 1, lightweight access tokens and audience handling in Phase 11, the logout confirmation NPE and cross-port cookie collision in Phase 16, CSRF on scripted login in Phase 8). Ready to proceed to [Phase 18 — End-to-End Demo](phase-18-end-to-end-demo.md).
