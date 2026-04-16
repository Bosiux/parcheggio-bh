import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import psycopg2
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
SESSIONS = {}


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL non configurato")
    return psycopg2.connect(database_url)


def now_utc():
    return datetime.now(timezone.utc)


def build_tokens():
    access_expires_at = now_utc() + timedelta(minutes=15)
    refresh_expires_at = now_utc() + timedelta(hours=2)
    return {
        "accessToken": secrets.token_urlsafe(32),
        "refreshToken": secrets.token_urlsafe(48),
        "accessTokenExpiresAt": int(access_expires_at.timestamp() * 1000),
        "refreshTokenExpiresAt": int(refresh_expires_at.timestamp() * 1000),
        "tokenType": "Bearer",
    }


def create_session(user_id):
    session_id = secrets.token_urlsafe(24)
    tokens = build_tokens()

    SESSIONS[session_id] = {
        "user_id": user_id,
        "access_token": tokens["accessToken"],
        "refresh_token": tokens["refreshToken"],
        "access_token_expires_at": datetime.fromtimestamp(tokens["accessTokenExpiresAt"] / 1000, tz=timezone.utc),
        "refresh_token_expires_at": datetime.fromtimestamp(tokens["refreshTokenExpiresAt"] / 1000, tz=timezone.utc),
    }

    return session_id, tokens


def get_session_identifier():
    header_value = request.headers.get("X-Session-Id")
    if header_value:
        return header_value

    body = request.get_json(silent=True) or {}
    return body.get("sessionId")


def get_session_data(session_id):
    session_data = SESSIONS.get(session_id)
    if not session_data:
        return None

    if session_data["refresh_token_expires_at"] <= now_utc():
        SESSIONS.pop(session_id, None)
        return None

    return session_data


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password_hash: str, password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not username or not password:
        return jsonify({"message": "Username e password sono obbligatori."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT id, username, password_hash, role FROM users WHERE lower(username) = %s",
                    (username,),
                )
                user_row = cursor.fetchone()
                if not user_row or not verify_password(user_row["password_hash"], password):
                    return jsonify({"message": "Credenziali non valide."}), 401

                session_id, tokens = create_session(user_row["id"])
            conn.commit()

        return (
            jsonify(
                {
                    "user": {
                        "id": user_row["id"],
                        "username": user_row["username"],
                        "role": user_row["role"],
                    },
                    "sessionId": session_id,
                    "tokens": tokens,
                }
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"message": "Errore durante il login.", "error": str(exc)}), 500


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip().lower()
    password = str(payload.get("password", "")).strip()

    if not username:
        return jsonify({"message": "Username obbligatorio."}), 400
    if len(password) < 6:
        return jsonify({"message": "La password deve avere almeno 6 caratteri."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT 1 FROM users WHERE lower(username) = %s", (username,))
                if cursor.fetchone():
                    return jsonify({"message": "Username gia registrato."}), 409

                cursor.execute(
                    """
                    INSERT INTO users (username, password_hash, role)
                    VALUES (%s, %s, 'user')
                    RETURNING id, username, role
                    """,
                    (username, hash_password(password)),
                )
                user_row = cursor.fetchone()
                session_id, tokens = create_session(user_row["id"])
            conn.commit()

        return (
            jsonify({"user": user_row, "sessionId": session_id, "tokens": tokens}),
            201,
        )
    except Exception as exc:
        return jsonify({"message": "Errore durante la registrazione.", "error": str(exc)}), 500


@auth_bp.post("/logout")
def logout():
    session_id = get_session_identifier()
    if not session_id:
        return jsonify({"message": "Sessione non valida."}), 401

    try:
        SESSIONS.pop(session_id, None)
        return jsonify({"message": "Logout effettuato."}), 200
    except Exception as exc:
        return jsonify({"message": "Errore durante il logout.", "error": str(exc)}), 500


@auth_bp.get("/me")
def get_me():
    session_id = get_session_identifier()
    if not session_id:
        return jsonify({"message": "Sessione non valida."}), 401

    try:
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({"message": "Sessione scaduta o non valida."}), 401

        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT id, username, role FROM users WHERE id = %s", (session_data["user_id"],))
                user_row = cursor.fetchone()

        if not user_row:
            SESSIONS.pop(session_id, None)
            return jsonify({"message": "Utente non valido."}), 401

        return jsonify({"user": user_row}), 200
    except Exception as exc:
        return jsonify({"message": "Errore durante il recupero utente.", "error": str(exc)}), 500


@auth_bp.post("/refresh")
def refresh():
    session_id = get_session_identifier()
    if not session_id:
        return jsonify({"message": "Sessione non valida."}), 401

    try:
        session_data = get_session_data(session_id)
        if not session_data:
            return jsonify({"message": "Sessione scaduta."}), 401

        # TODO: validare anche fingerprint/device prima del refresh token.
        access_expires_at = now_utc() + timedelta(minutes=15)
        access_token = secrets.token_urlsafe(32)

        session_data["access_token"] = access_token
        session_data["access_token_expires_at"] = access_expires_at

        return (
            jsonify(
                {
                    "sessionId": session_id,
                    "tokens": {
                        "accessToken": access_token,
                        "refreshToken": session_data["refresh_token"],
                        "accessTokenExpiresAt": int(access_expires_at.timestamp() * 1000),
                        "refreshTokenExpiresAt": int(session_data["refresh_token_expires_at"].timestamp() * 1000),
                        "tokenType": "Bearer",
                    },
                }
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"message": "Errore refresh token.", "error": str(exc)}), 500
