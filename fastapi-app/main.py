"""
Demo SSO — FastAPI backend.

Exposes:
  GET /api/public   — no authentication required.
  GET /api/profile  — requires a valid Keycloak-issued access token,
                       supplied as: Authorization: Bearer <access_token>
"""

from dotenv import load_dotenv

load_dotenv()  # loads .env before reading KEYCLOAK_* env vars in jwt_auth

from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from db import get_connection
from jwt_auth import validate_access_token

app = FastAPI(title="Demo SSO FastAPI Backend")

bearer_scheme = HTTPBearer(auto_error=False)


def require_valid_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency: extracts the Bearer token and validates it
    against Keycloak (signature, issuer, expiration — see jwt_auth.py).
    Returns 401 for a missing, malformed, invalid, or expired token."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization: Bearer <access_token> header",
        )
    return validate_access_token(credentials.credentials)


@app.get("/api/public")
def public_endpoint():
    """No authentication required — reachable by anyone."""
    return {"message": "This is a public endpoint. No authentication required."}


@app.get("/api/profile")
def profile_endpoint(claims: dict = Depends(require_valid_token)):
    """Requires a valid access token. Returns only safe identity claims —
    never the raw token itself."""
    return {
        "message": "Token validated successfully.",
        "username": claims.get("preferred_username"),
        "email": claims.get("email"),
        "name": claims.get("name"),
        "subject": claims.get("sub"),
        "issuer": claims.get("iss"),
    }


# --- Application business data: products (demo_app_db) -----------------


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    price: Decimal = Field(gt=0)


@app.get("/api/products")
def list_products():
    """Reads business data from demo_app_db — entirely separate from
    Keycloak's own database (keycloak_db)."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, price, created_at FROM products ORDER BY id"
        ).fetchall()
    return rows


@app.post("/api/products", status_code=status.HTTP_201_CREATED)
def create_product(product: ProductIn):
    with get_connection() as conn:
        row = conn.execute(
            "INSERT INTO products (name, price) VALUES (%s, %s) "
            "RETURNING id, name, price, created_at",
            (product.name, product.price),
        ).fetchone()
        conn.commit()
    return row
