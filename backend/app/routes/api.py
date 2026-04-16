from flask import Blueprint, request, jsonify, session
import bcrypt
import os
import re

api_bp = Blueprint("api", __name__)

# ─────────────────────────────────────────────────────────────────────────────
# Connessione DB
# ─────────────────────────────────────────────────────────────────────────────

def get_db():
    """Restituisce una connessione psycopg3. Usare in un contesto `with`."""
    import psycopg
    return psycopg.connect(os.getenv("DATABASE_URL"))


# ─────────────────────────────────────────────────────────────────────────────
# Helper autenticazione
# ─────────────────────────────────────────────────────────────────────────────

def current_user():
    """Restituisce il dizionario utente dalla sessione, o None."""
    return session.get("user")


def require_auth():
    """Ritorna (user, None) oppure (None, risposta_errore)."""
    u = current_user()
    if not u:
        return None, (jsonify({"error": "Non autenticato"}), 401)
    return u, None


def require_admin():
    """Ritorna (user, None) oppure (None, risposta_errore)."""
    u, err = require_auth()
    if err:
        return None, err
    if u["role"] != "admin":
        return None, (jsonify({"error": "Accesso riservato agli amministratori"}), 403)
    return u, None


# ─────────────────────────────────────────────────────────────────────────────
# Auth endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username e password sono obbligatori"}), 400

    username = data["username"].strip()
    password = data["password"]

    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT id, username, password_hash, role FROM users WHERE username = %s",
                (username,),
            ).fetchone()
    except Exception as e:
        return jsonify({"error": "Errore database", "detail": str(e)}), 500

    if row is None:
        return jsonify({"error": "Credenziali non valide"}), 401

    user_id, db_username, password_hash, role = row

    # Verifica bcrypt
    if not bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
        return jsonify({"error": "Credenziali non valide"}), 401

    # Salva nella sessione server-side (cookie firmato inviato al browser)
    session["user"] = {"id": user_id, "username": db_username, "role": role}

    return jsonify({"message": "Login effettuato", "user": {"id": user_id, "username": db_username, "role": role}})


@api_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout effettuato"})


@api_bp.route("/me", methods=["GET"])
def me():
    u, err = require_auth()
    if err:
        return err
    return jsonify(u)


@api_bp.route("/register", methods=["POST"])
def register():
    """
    Registrazione libera — crea SOLO utenti con ruolo 'user'.
    Gli admin non possono essere creati tramite questa rotta.
    """
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username e password sono obbligatori"}), 400

    username = data["username"].strip()
    password = data["password"]

    # Validazione username: solo lettere, numeri, underscore (3-32 caratteri)
    if not re.match(r"^[a-zA-Z0-9_]{3,32}$", username):
        return jsonify({"error": "Username non valido (3-32 caratteri, solo lettere/numeri/_)"}), 400

    # Validazione password: minimo 8 caratteri
    if len(password) < 8:
        return jsonify({"error": "La password deve essere di almeno 8 caratteri"}), 400

    # Hash bcrypt (cost factor 12 — buon bilanciamento sicurezza/velocità)
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

    try:
        with get_db() as conn:
            existing = conn.execute(
                "SELECT id FROM users WHERE username = %s", (username,)
            ).fetchone()
            if existing:
                return jsonify({"error": "Username già in uso"}), 409

            row = conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, 'user') RETURNING id, username, role",
                (username, password_hash),
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": "Errore database", "detail": str(e)}), 500

    user_id, db_username, role = row
    # Auto-login dopo la registrazione
    session["user"] = {"id": user_id, "username": db_username, "role": role}

    return jsonify({"message": "Registrazione completata", "user": {"id": user_id, "username": db_username, "role": role}}), 201


# ─────────────────────────────────────────────────────────────────────────────
# User endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route("/api/users", methods=["GET"])
def get_users():
    _, err = require_admin()
    if err:
        return err
    try:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
            ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([
        {"id": r[0], "username": r[1], "role": r[2], "created_at": r[3].isoformat()}
        for r in rows
    ])


@api_bp.route("/api/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    u, err = require_auth()
    if err:
        return err
    # Un utente può vedere solo se stesso; l'admin può vedere tutti
    if u["role"] != "admin" and u["id"] != user_id:
        return jsonify({"error": "Non autorizzato"}), 403
    try:
        with get_db() as conn:
            row = conn.execute(
                "SELECT id, username, role, created_at FROM users WHERE id = %s", (user_id,)
            ).fetchone()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not row:
        return jsonify({"error": "Utente non trovato"}), 404
    return jsonify({"id": row[0], "username": row[1], "role": row[2], "created_at": row[3].isoformat()})


@api_bp.route("/api/user", methods=["POST"])
def create_user():
    """Solo admin può creare utenti con ruolo arbitrario (incluso admin)."""
    _, err = require_admin()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "username e password obbligatori"}), 400

    username = data["username"].strip()
    role = data.get("role", "user")
    if role not in ("user", "admin"):
        return jsonify({"error": "Ruolo non valido"}), 400

    password_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

    try:
        with get_db() as conn:
            existing = conn.execute("SELECT id FROM users WHERE username = %s", (username,)).fetchone()
            if existing:
                return jsonify({"error": "Username già in uso"}), 409
            row = conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING id, username, role",
                (username, password_hash, role),
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"id": row[0], "username": row[1], "role": row[2]}), 201


@api_bp.route("/api/user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    u, err = require_admin()
    if err:
        return err
    if u["id"] == user_id:
        return jsonify({"error": "Non puoi eliminare te stesso"}), 400
    try:
        with get_db() as conn:
            result = conn.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,)).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not result:
        return jsonify({"error": "Utente non trovato"}), 404
    return jsonify({"message": "Utente eliminato"})


# ─────────────────────────────────────────────────────────────────────────────
# Parking areas endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route("/api/parking-areas", methods=["GET"])
def get_parking_areas():
    u, err = require_auth()
    if err:
        return err
    try:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT id, name, capacity, is_active, available_spots FROM v_parking_availability ORDER BY id"
            ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([
        {"id": r[0], "name": r[1], "capacity": r[2], "is_active": r[3], "available_spots": r[4]}
        for r in rows
    ])


@api_bp.route("/api/parking-areas/active", methods=["GET"])
def get_active_parking_areas():
    u, err = require_auth()
    if err:
        return err
    try:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT id, name, capacity, is_active, available_spots FROM v_parking_availability WHERE is_active = TRUE ORDER BY id"
            ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([
        {"id": r[0], "name": r[1], "capacity": r[2], "is_active": r[3], "available_spots": r[4]}
        for r in rows
    ])


@api_bp.route("/api/parking-areas", methods=["POST"])
def create_parking_area():
    _, err = require_admin()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("capacity"):
        return jsonify({"error": "capacity obbligatoria"}), 400
    try:
        with get_db() as conn:
            row = conn.execute(
                "INSERT INTO parking_areas (name, capacity, is_active) VALUES (%s, %s, %s) RETURNING id, name, capacity, is_active",
                (data.get("name"), int(data["capacity"]), data.get("is_active", True)),
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"id": row[0], "name": row[1], "capacity": row[2], "is_active": row[3]}), 201


@api_bp.route("/api/parking-areas/<int:area_id>", methods=["PUT"])
def update_parking_area(area_id):
    _, err = require_admin()
    if err:
        return err
    data = request.get_json()
    try:
        with get_db() as conn:
            row = conn.execute(
                """UPDATE parking_areas
                   SET name = COALESCE(%s, name),
                       capacity = COALESCE(%s, capacity),
                       is_active = COALESCE(%s, is_active)
                   WHERE id = %s
                   RETURNING id, name, capacity, is_active""",
                (data.get("name"), data.get("capacity"), data.get("is_active"), area_id),
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not row:
        return jsonify({"error": "Area non trovata"}), 404
    return jsonify({"id": row[0], "name": row[1], "capacity": row[2], "is_active": row[3]})


@api_bp.route("/api/parking-areas/<int:area_id>", methods=["DELETE"])
def delete_parking_area(area_id):
    _, err = require_admin()
    if err:
        return err
    try:
        with get_db() as conn:
            result = conn.execute(
                "DELETE FROM parking_areas WHERE id = %s RETURNING id", (area_id,)
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not result:
        return jsonify({"error": "Area non trovata"}), 404
    return jsonify({"message": "Area eliminata"})


# ─────────────────────────────────────────────────────────────────────────────
# Reservations endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route("/api/reservations", methods=["GET"])
def get_reservations():
    u, err = require_auth()
    if err:
        return err
    try:
        with get_db() as conn:
            if u["role"] == "admin":
                rows = conn.execute(
                    """SELECT r.id, r.user_id, us.username, r.parking_area_id, pa.name,
                              r.starts_at, r.ends_at, r.status, r.created_at
                       FROM reservations r
                       JOIN users us ON us.id = r.user_id
                       JOIN parking_areas pa ON pa.id = r.parking_area_id
                       ORDER BY r.starts_at DESC"""
                ).fetchall()
            else:
                rows = conn.execute(
                    """SELECT r.id, r.user_id, us.username, r.parking_area_id, pa.name,
                              r.starts_at, r.ends_at, r.status, r.created_at
                       FROM reservations r
                       JOIN users us ON us.id = r.user_id
                       JOIN parking_areas pa ON pa.id = r.parking_area_id
                       WHERE r.user_id = %s
                       ORDER BY r.starts_at DESC""",
                    (u["id"],),
                ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([
        {
            "id": r[0], "user_id": r[1], "username": r[2],
            "parking_area_id": r[3], "parking_area_name": r[4],
            "starts_at": r[5].isoformat(), "ends_at": r[6].isoformat(),
            "status": r[7], "created_at": r[8].isoformat(),
        }
        for r in rows
    ])


@api_bp.route("/api/reservations", methods=["POST"])
def create_reservation():
    u, err = require_auth()
    if err:
        return err
    data = request.get_json()
    if not data or not data.get("parking_area_id"):
        return jsonify({"error": "parking_area_id obbligatorio"}), 400
    try:
        with get_db() as conn:
            # Verifica disponibilità
            avail = conn.execute(
                "SELECT available_spots FROM v_parking_availability WHERE id = %s AND is_active = TRUE",
                (data["parking_area_id"],),
            ).fetchone()
            if not avail:
                return jsonify({"error": "Area non trovata o non attiva"}), 404
            if avail[0] <= 0:
                return jsonify({"error": "Nessun posto disponibile"}), 409

            row = conn.execute(
                """INSERT INTO reservations (user_id, parking_area_id, starts_at, ends_at)
                   VALUES (%s, %s,
                     COALESCE(%s::timestamptz, NOW()),
                     COALESCE(%s::timestamptz, NOW() + INTERVAL '1 hour'))
                   RETURNING id, user_id, parking_area_id, starts_at, ends_at, status""",
                (
                    u["id"], data["parking_area_id"],
                    data.get("starts_at"), data.get("ends_at"),
                ),
            ).fetchone()
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "id": row[0], "user_id": row[1], "parking_area_id": row[2],
        "starts_at": row[3].isoformat(), "ends_at": row[4].isoformat(), "status": row[5],
    }), 201


@api_bp.route("/api/reservations/<int:res_id>/cancel", methods=["POST"])
def cancel_reservation(res_id):
    u, err = require_auth()
    if err:
        return err
    try:
        with get_db() as conn:
            res = conn.execute(
                "SELECT user_id, status FROM reservations WHERE id = %s", (res_id,)
            ).fetchone()
            if not res:
                return jsonify({"error": "Prenotazione non trovata"}), 404
            if u["role"] != "admin" and res[0] != u["id"]:
                return jsonify({"error": "Non autorizzato"}), 403
            if res[1] != "active":
                return jsonify({"error": "Solo le prenotazioni attive possono essere cancellate"}), 409
            conn.execute(
                "UPDATE reservations SET status = 'cancelled' WHERE id = %s", (res_id,)
            )
            conn.commit()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Prenotazione cancellata"})


# ─────────────────────────────────────────────────────────────────────────────
# Statistics endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route("/api/stats/areas", methods=["GET"])
def stats_areas():
    _, err = require_admin()
    if err:
        return err
    try:
        with get_db() as conn:
            rows = conn.execute(
                """SELECT pa.id, pa.name, pa.capacity,
                          COUNT(r.id) AS total_reservations,
                          COUNT(r.id) FILTER (WHERE r.status = 'active') AS active_reservations,
                          COUNT(r.id) FILTER (WHERE r.status = 'completed') AS completed_reservations,
                          COUNT(r.id) FILTER (WHERE r.status = 'cancelled') AS cancelled_reservations
                   FROM parking_areas pa
                   LEFT JOIN reservations r ON r.parking_area_id = pa.id
                   GROUP BY pa.id
                   ORDER BY pa.id"""
            ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([
        {
            "id": r[0], "name": r[1], "capacity": r[2],
            "total": r[3], "active": r[4], "completed": r[5], "cancelled": r[6],
        }
        for r in rows
    ])


@api_bp.route("/api/stats/timeseries", methods=["GET"])
def stats_timeseries():
    _, err = require_admin()
    if err:
        return err
    try:
        with get_db() as conn:
            rows = conn.execute(
                """SELECT DATE(starts_at) AS day, COUNT(*) AS reservations
                   FROM reservations
                   WHERE starts_at >= NOW() - INTERVAL '30 days'
                   GROUP BY day
                   ORDER BY day"""
            ).fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify([{"day": r[0].isoformat(), "reservations": r[1]} for r in rows])
