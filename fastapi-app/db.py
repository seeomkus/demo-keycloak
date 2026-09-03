"""
Database access for the demo application's own business data.

Deliberately connects to `demo_app_db` only, via a dedicated `app_user`
credential (see Phase 3 / Phase 13) — never to `keycloak_db`, which is
Keycloak's own internal schema and must stay logically separate from
application data.
"""

import os

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)
