# Phase 10 — JWT (JSON Web Token)

**Status:** ✅ Completed
**Date:** 2026-09-01
**Type:** Conceptual explanation, using a **dummy/sanitized** token — no active/real token is reproduced here, per the demo's mandatory rules.

## Objective

Explain the structure of a JWT, its standard claims, and the distinction between an ID Token and an Access Token, grounded in the shape of the tokens actually issued by Keycloak during the [Phase 8](phase-08-nextjs-portal.md) login.

## Structure

```mermaid
flowchart LR
    A["HEADER\n(algorithm & token type)"] -.->|"."| B["PAYLOAD\n(claims)"]
    B -.->|"."| C["SIGNATURE\n(verifies integrity & authenticity)"]
```

Encoded form (Base64URL segments joined by `.`):

```text
HEADER.PAYLOAD.SIGNATURE
```

Example (structure only — values sanitized):

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODgvcmVhbG1zL2RlbW8tc3NvIn0.SANITIZED_SIGNATURE
```

## Decoded Example (Sanitized ID Token)

**Header:**

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "SANITIZED_KEY_ID"
}
```

**Payload:**

```json
{
  "iss": "http://localhost:8088/realms/demo-sso",
  "sub": "025dc481-252b-495c-87ba-1c5204ce1612",
  "aud": "nextjs-portal",
  "exp": 1788233868,
  "iat": 1788233568,
  "preferred_username": "demo.user",
  "email": "demo.user@example.local",
  "name": "Demo User"
}
```

**Signature:** the result of signing `HEADER + "." + PAYLOAD` with Keycloak's private key (RS256 by default). Consumers verify it using the corresponding public key, published at Keycloak's JWKS endpoint:

```text
http://localhost:8088/realms/demo-sso/protocol/openid-connect/certs
```

## Standard Claims Explained

| Claim | Meaning | Example (sanitized) |
|---|---|---|
| `iss` (issuer) | Who issued the token — used to confirm it came from the expected Keycloak realm | `http://localhost:8088/realms/demo-sso` |
| `sub` (subject) | The stable, unique identifier of the user within this realm | `025dc481-252b-495c-87ba-1c5204ce1612` |
| `aud` (audience) | Who the token is intended for — prevents a token issued for one client being replayed against another | `nextjs-portal` |
| `exp` (expiration) | Unix timestamp after which the token is no longer valid | `1788233868` |
| `iat` (issued at) | Unix timestamp when the token was issued | `1788233568` |
| `scope` | The granted permission scope (typically present on the access token) | `openid profile email` |

## ID Token vs. Access Token

```mermaid
flowchart TB
    IDT["ID Token"] --> IDT1["Answers: who is this user?"]
    IDT1 --> IDT2["Consumed by the client app (Next.js)\nto display identity"]

    AT["Access Token"] --> AT1["Answers: what is this request allowed to access?"]
    AT1 --> AT2["Sent as a Bearer token\nto an API (FastAPI) for authorization"]
```

| | ID Token | Access Token |
|---|---|---|
| Answers | "Who is this user?" | "What is this request allowed to do?" |
| Consumed by | The client application (Next.js) | The resource server / API (FastAPI) |
| Always JWT? | Yes — mandated by the OIDC spec | Depends on the IdP — Keycloak issues JWT access tokens by default |
| Role in this demo | Renders identity on `/profile` | Sent as `Authorization: Bearer <token>` to `/api/profile` in [Phase 12](phase-12-nextjs-fastapi-integration.md) |

## Why the Signature Matters

Without a signature, anyone could construct an arbitrary payload — e.g. `"sub": "admin"` — and claim to be any user. The RS256 signature guarantees:

1. **Integrity** — the payload has not been altered since it was issued.
2. **Authenticity** — the token was genuinely issued by Keycloak, since only Keycloak holds the private signing key; verifiers only ever need the public key from the JWKS endpoint.

This is also why JWT validation (covered in [Phase 11](phase-11-fastapi.md)) checks the signature, issuer, audience, and expiration together — a token can only be trusted if all four checks pass.

## Checkpoint

✅ JWT structure, standard claims, and the ID Token vs. Access Token distinction explained using a sanitized example — no real/active token was requested from or reproduced by the user. Ready to proceed to [Phase 11 — FastAPI](phase-11-fastapi.md).
