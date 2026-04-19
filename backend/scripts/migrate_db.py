"""
Migrazione sicura del database — aggiunge le colonne mancanti senza toccare i dati esistenti.
Esegui con: python scripts/migrate_db.py
"""
import os
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERRORE: DATABASE_URL non trovato nel file .env")
    sys.exit(1)

MIGRATION_SQL = """
-- parking_areas: aggiunge lat, lng, updated_at se mancanti
ALTER TABLE parking_areas
  ADD COLUMN IF NOT EXISTS lat         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- bookings: aggiunge updated_at se mancante
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- user_sessions: aggiunge updated_at se mancante
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
"""

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(MIGRATION_SQL)
    conn.close()
    print("Migrazione completata con successo.")
except Exception as e:
    print(f"ERRORE durante la migrazione: {e}")
    sys.exit(1)
