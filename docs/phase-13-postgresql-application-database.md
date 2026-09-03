# Phase 13 — PostgreSQL Application Database

**Status:** ✅ Completed
**Date:** 2026-09-01

## Objective

Give the demo application its own business data, stored in `demo_app_db` — completely separate from Keycloak's own database — exposed through FastAPI as `GET /api/products` and `POST /api/products`.

## Architecture

```mermaid
flowchart LR
    KC["Keycloak\n↓\nAuthentication"] -.->|no data sharing| PG
    N["Next.js\n↓\nFrontend"] --> F
    F["FastAPI\n↓\nBusiness Logic"] --> PG[("demo_app_db\n↓\nApplication Data")]
```

This mirrors the layered responsibility already established in [Phase 4](phase-04-configure-keycloak-database.md): `keycloak_db` and `demo_app_db` remain two independent databases with independent credentials, even though both live on the same PostgreSQL server.

## Table: `products`

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Created and seeded via the dedicated `app_user` account (from [Phase 3](phase-03-postgresql.md)) — not the PostgreSQL superuser:

```bash
PGPASSWORD=app_demo_pass psql -h 127.0.0.1 -U app_user -d demo_app_db -f create_products.sql
```

Seed data: `Demo Keyboard` (350000), `Demo Mouse` (150000).

## FastAPI Integration

### `db.py`

```python
DATABASE_URL = os.environ["DATABASE_URL"]  # postgresql://app_user:...@127.0.0.1:5432/demo_app_db

def get_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)
```

The connection string, read from the `DATABASE_URL` environment variable, points **only** at `demo_app_db` with the `app_user` credential — FastAPI has no access to `keycloak_db` at all, enforcing the separation at the database-user level, not just by convention.

### Endpoints

```python
@app.get("/api/products")
def list_products():
    with get_connection() as conn:
        return conn.execute(
            "SELECT id, name, price, created_at FROM products ORDER BY id"
        ).fetchall()

@app.post("/api/products", status_code=201)
def create_product(product: ProductIn):
    with get_connection() as conn:
        row = conn.execute(
            "INSERT INTO products (name, price) VALUES (%s, %s) "
            "RETURNING id, name, price, created_at",
            (product.name, product.price),
        ).fetchone()
        conn.commit()
        return row
```

`ProductIn` is a Pydantic model requiring a non-empty `name` and a `price` greater than zero — invalid input is rejected with `422` before it ever reaches the database.

## Verification

```bash
# GET before insert
curl http://localhost:8089/api/products
# => 200, 2 seeded products

# POST a new product
curl -X POST http://localhost:8089/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Demo Webcam", "price": 275000}'
# => 201, {"id":3,"name":"Demo Webcam","price":275000.0,"created_at":"..."}

# GET after insert
curl http://localhost:8089/api/products
# => 200, 3 products — the new one persisted
```

## Checkpoint

✅ `demo_app_db` now holds a real `products` table, accessed exclusively through the dedicated `app_user` credential. FastAPI exposes `GET`/`POST /api/products`, verified to correctly read and persist data, fully independent of Keycloak's `keycloak_db`. Ready to proceed to [Phase 14 — Next.js Admin](phase-14-nextjs-admin.md).
