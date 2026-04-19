-- Migrazione schema v2 — da eseguire come owner delle tabelle (es. postgres)
-- Aggiunge le colonne mancanti senza toccare i dati esistenti.

ALTER TABLE parking_areas
  ADD COLUMN IF NOT EXISTS lat         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
