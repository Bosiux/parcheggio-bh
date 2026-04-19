"""
Connessione al DB e rilevamento colonne disponibili.
"""
import os

import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL non configurato")
    return psycopg2.connect(database_url)


def _check_columns(table: str, columns: list) -> set:
    """Restituisce il sottoinsieme di `columns` effettivamente presenti in `table`."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = %s AND column_name = ANY(%s)
                    """,
                    (table, columns),
                )
                return {row[0] for row in cur.fetchall()}
    except Exception:
        return set()


# Rilevamento colonne opzionali — eseguito una sola volta all'avvio
_areas_cols = _check_columns("parking_areas", ["lat", "lng", "updated_at"])
_bookings_cols = _check_columns("bookings", ["updated_at"])
_sessions_cols = _check_columns("user_sessions", ["updated_at"])

HAS_COORDS = "lat" in _areas_cols and "lng" in _areas_cols
HAS_AREAS_UPDATED_AT = "updated_at" in _areas_cols
HAS_BOOKINGS_UPDATED_AT = "updated_at" in _bookings_cols
HAS_SESSIONS_UPDATED_AT = "updated_at" in _sessions_cols
