"""
JWT validation against Keycloak.

Validates an access token presented as a Bearer token by:
  1. Signature  — verified against Keycloak's public keys (JWKS), fetched
                  and cached from KEYCLOAK_JWKS_URL. Only Keycloak holds the
                  private key, so a valid signature proves Keycloak issued it.
  2. Issuer     — must exactly match KEYCLOAK_ISSUER, so a token from a
                  different realm or a different Keycloak server is rejected.
  3. Expiration — python-jose rejects tokens whose `exp` has passed.
  4. Audience   — Keycloak's default access tokens for this demo do not set
                  an `aud` claim (confirmed by direct inspection during
                  Phase 11 setup); the client identity instead appears in
                  `azp` (authorized party). Audience validation is therefore
                  left disabled here (`verify_aud=False`) and `azp` is
                  checked explicitly against the expected client whenever a
                  caller supplies EXPECTED_AZP. This avoids silently
                  accepting tokens meant for a different, unrelated client
                  while staying correct for Keycloak's actual token shape.
"""

import os
import time
from functools import lru_cache

import httpx
from fastapi import HTTPException, status
from jose import jwt
from jose.exceptions import JWTError

KEYCLOAK_ISSUER = os.environ["KEYCLOAK_ISSUER"]
KEYCLOAK_JWKS_URL = os.environ["KEYCLOAK_JWKS_URL"]
EXPECTED_AZP = os.environ.get("KEYCLOAK_EXPECTED_AZP")  # optional, e.g. "nextjs-portal"

_JWKS_CACHE_TTL_SECONDS = 300
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}


def _get_jwks() -> dict:
    """Fetch Keycloak's JSON Web Key Set, cached briefly to avoid a network
    round trip on every request while still picking up key rotation."""
    now = time.time()
    if _jwks_cache["keys"] is None or (now - _jwks_cache["fetched_at"]) > _JWKS_CACHE_TTL_SECONDS:
        resp = httpx.get(KEYCLOAK_JWKS_URL, timeout=5.0)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


def validate_access_token(token: str) -> dict:
    """Validate a Keycloak-issued access token. Raises HTTPException(401)
    on any failure; returns the decoded claims on success."""
    try:
        jwks = _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        key = next(
            (k for k in jwks.get("keys", []) if k.get("kid") == unverified_header.get("kid")),
            None,
        )
        if key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unknown signing key (kid) — token may be from a different realm/server",
            )

        claims = jwt.decode(
            token,
            key,
            algorithms=[unverified_header.get("alg", "RS256")],
            issuer=KEYCLOAK_ISSUER,
            options={
                "verify_aud": False,  # see module docstring: Keycloak's default
                                       # access tokens in this demo carry no `aud`
                "verify_iss": True,
                "verify_exp": True,
                "verify_signature": True,
            },
        )

        if EXPECTED_AZP and claims.get("azp") != EXPECTED_AZP:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token was not issued for the expected client (azp mismatch)",
            )

        return claims

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc
