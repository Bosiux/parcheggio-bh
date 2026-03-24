
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS parking_areas CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE  IF EXISTS user_role;
DROP TYPE  IF EXISTS reservation_status;

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE reservation_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE users (
    id            SERIAL          PRIMARY KEY,
    username      VARCHAR(64)     NOT NULL UNIQUE,
    password_hash VARCHAR(255)    NOT NULL,
    role          user_role       NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role);

COMMENT ON TABLE  users                IS 'Utenti del sistema (cittadini e amministratori)';
COMMENT ON COLUMN users.password_hash  IS 'Hash bcrypt della password';
COMMENT ON COLUMN users.role           IS 'Ruolo: user = cittadino, admin = amministratore';

CREATE TABLE parking_areas (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(128),
    capacity    INTEGER         NOT NULL CHECK (capacity > 0),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parking_areas_active ON parking_areas (is_active);

COMMENT ON TABLE  parking_areas           IS 'Aree di parcheggio gestite dal Comune';
COMMENT ON COLUMN parking_areas.name      IS 'Nome descrittivo opzionale (es. Parcheggio Vittoria)';
COMMENT ON COLUMN parking_areas.capacity  IS 'Numero massimo di posti disponibili';
COMMENT ON COLUMN parking_areas.is_active IS 'FALSE = area disattivata, esclusa dal servizio';

CREATE TABLE reservations (
    id               SERIAL              PRIMARY KEY,
    user_id          INTEGER             NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    parking_area_id  INTEGER             NOT NULL REFERENCES parking_areas(id) ON DELETE RESTRICT,
    starts_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    ends_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    status           reservation_status  NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX idx_reservations_user        ON reservations (user_id);
CREATE INDEX idx_reservations_area        ON reservations (parking_area_id);
CREATE INDEX idx_reservations_status      ON reservations (status);
CREATE INDEX idx_reservations_starts_at   ON reservations (starts_at DESC);
CREATE INDEX idx_reservations_area_active ON reservations (parking_area_id, status)
    WHERE status = 'active';

COMMENT ON TABLE  reservations                  IS 'Prenotazioni dei posti auto';
COMMENT ON COLUMN reservations.starts_at        IS 'Inizio della prenotazione';
COMMENT ON COLUMN reservations.ends_at          IS 'Fine della prenotazione (default: starts_at + 1 ora)';
COMMENT ON COLUMN reservations.status           IS 'active | completed | cancelled';

CREATE VIEW v_parking_availability AS
SELECT
    p.id,
    p.name,
    p.capacity,
    p.is_active,
    COALESCE(
        p.capacity - COUNT(r.id) FILTER (
            WHERE r.status = 'active' AND r.ends_at > NOW()
        ),
        p.capacity
    ) AS available_spots
FROM  parking_areas p
LEFT  JOIN reservations r ON r.parking_area_id = p.id
GROUP BY p.id;

COMMENT ON VIEW v_parking_availability IS
    'Posti disponibili in tempo reale per ogni area (capacity - prenotazioni active non scadute)';

CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE reservations
    SET    status = 'completed'
    WHERE  status = 'active'
      AND  ends_at < NOW();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION expire_reservations IS
    'Marca come completed le prenotazioni la cui ends_at è nel passato. Restituisce il numero di righe aggiornate.';

-- Password: "password123" (bcrypt)
INSERT INTO users (username, password_hash, role) VALUES
    ('admin',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
    ('mario',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('giulia',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('luca',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

INSERT INTO parking_areas (name, capacity, is_active) VALUES
    ('Parcheggio Vittoria',        50, TRUE),
    ('Parcheggio Brescia Centro',  30, TRUE),
    ('Parcheggio Stazione FS',     80, TRUE),
    ('Parcheggio Castello',        20, TRUE),
    ('Parcheggio Fiera (dismesso)', 100, FALSE);

INSERT INTO reservations (user_id, parking_area_id, starts_at, ends_at, status) VALUES
    (2, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 'completed'),
    (2, 2, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '23 hours','completed'),
    (3, 1, NOW() - INTERVAL '30 min',  NOW() + INTERVAL '30 min',  'active'),
    (3, 3, NOW() - INTERVAL '2 days',  NOW() - INTERVAL '47 hours','completed'),
    (4, 2, NOW(),                       NOW() + INTERVAL '1 hour',  'active'),
    (4, 4, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '4 days 23 hours', 'completed'),
    (2, 3, NOW() - INTERVAL '10 min',  NOW() + INTERVAL '50 min',  'active');
