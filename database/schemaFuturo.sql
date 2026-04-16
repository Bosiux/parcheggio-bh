DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS parking_areas CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS booking_status;

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE booking_status AS ENUM ('active', 'completed', 'expired', 'cancelled');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_password_hash_bcrypt CHECK (
        password_hash LIKE '$2a$%'
        OR password_hash LIKE '$2b$%'
        OR password_hash LIKE '$2y$%'
    )
);

COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt della password';

CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_exp ON user_sessions(refresh_token_expires_at);

CREATE TABLE parking_areas (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    is_under_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookings (
    id VARCHAR(24) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id VARCHAR(16) NOT NULL REFERENCES parking_areas(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours BETWEEN 1 AND 24),
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    status booking_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_area_id ON bookings(area_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time DESC);

INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2b$12$dmulsft2VLXChL0A9ArbU.bPMIYU7EFK7M7sxaEy.4Akn6o76PT8G', 'admin'),
    ('user', '$2b$12$j1lfzRrpTDPcbgdEhBkWeubH1/fC3xdI.GMmlrTIoox9Ze/FkTIaa', 'user');

INSERT INTO parking_areas (id, name, capacity, hourly_rate, is_under_maintenance) VALUES
    ('P01', 'Parcheggio Centro', 80, 2.50, FALSE),
    ('P02', 'Parcheggio Stazione', 60, 2.00, FALSE),
    ('P03', 'Parcheggio Ospedale', 100, 1.80, FALSE),
    ('P04', 'Parcheggio Via Roma', 40, 3.20, FALSE),
    ('P05', 'Parcheggio Castello', 30, 2.70, FALSE);

INSERT INTO bookings (id, user_id, area_id, start_time, end_time, duration_hours, hourly_rate, total_price, status) VALUES
    ('BK001', 2, 'P01', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 1, 2.50, 2.50, 'completed'),
    ('BK002', 2, 'P02', NOW() + INTERVAL '10 minutes', NOW() + INTERVAL '70 minutes', 1, 2.00, 2.00, 'active');
