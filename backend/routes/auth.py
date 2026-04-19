import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import psycopg2
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor

from db import HAS_SESSIONS_UPDATED_AT, get_db_connection
from extensions import limiter


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


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


def create_session(cursor, user_id):
    session_id = secrets.token_urlsafe(24)
    tokens = build_tokens()
    access_exp = datetime.fromtimestamp(tokens["accessTokenExpiresAt"] / 1000, tz=timezone.utc)
    refresh_exp = datetime.fromtimestamp(tokens["refreshTokenExpiresAt"] / 1000, tz=timezone.utc)

    cursor.execute(
        """
        INSERT INTO user_sessions
            (session_id, user_id, access_token, refresh_token,
             access_token_expires_at, refresh_token_expires_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (session_id, user_id, tokens["accessToken"], tokens["refreshToken"], access_exp, refresh_exp),
    )
    return session_id, tokens


def get_session_data(cursor, session_id):
    cursor.execute(
        """
        SELECT user_id, access_token, refresh_token,
               access_token_expires_at, refresh_token_expires_at
        FROM user_sessions
        WHERE session_id = %s
          AND refresh_token_expires_at > NOW()
        """,
        (session_id,),
    )
    return cursor.fetchone()


def get_session_identifier():
    header_value = request.headers.get("X-Session-Id")
    if header_value:
        return header_value
    body = request.get_json(silent=True) or {}
    return body.get("sessionId")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password_hash: str, password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


@auth_bp.post("/login")
@limiter.limit("10 per minute")
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

                session_id, tokens = create_session(cursor, user_row["id"])
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
@limiter.limit("5 per minute")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip().lower()
    password = str(payload.get("password", "")).strip()

    if not username:
        return jsonify({"message": "Username obbligatorio."}), 400
    if len(password) < 8:
        return jsonify({"message": "La password deve avere almeno 8 caratteri."}), 400

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
                session_id, tokens = create_session(cursor, user_row["id"])
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
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM user_sessions WHERE session_id = %s", (session_id,))
            conn.commit()
        return jsonify({"message": "Logout effettuato."}), 200
    except Exception as exc:
        return jsonify({"message": "Errore durante il logout.", "error": str(exc)}), 500


@auth_bp.get("/me")
def get_me():
    session_id = get_session_identifier()
    if not session_id:
        return jsonify({"message": "Sessione non valida."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                session_data = get_session_data(cursor, session_id)
                if not session_data:
                    return jsonify({"message": "Sessione scaduta o non valida."}), 401
                cursor.execute(
                    "SELECT id, username, role FROM users WHERE id = %s",
                    (session_data["user_id"],),
                )
                user_row = cursor.fetchone()

        if not user_row:
            return jsonify({"message": "Utente non trovato."}), 401

        return jsonify({"user": user_row}), 200
    except Exception as exc:
        return jsonify({"message": "Errore durante il recupero utente.", "error": str(exc)}), 500


@auth_bp.post("/refresh")
def refresh():
    session_id = get_session_identifier()
    if not session_id:
        return jsonify({"message": "Sessione non valida."}), 401

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                session_data = get_session_data(cursor, session_id)
                if not session_data:
                    return jsonify({"message": "Sessione scaduta."}), 401

                access_expires_at = now_utc() + timedelta(minutes=15)
                access_token = secrets.token_urlsafe(32)

                set_parts = ["access_token = %s", "access_token_expires_at = %s"]
                if HAS_SESSIONS_UPDATED_AT:
                    set_parts.append("updated_at = NOW()")
                cursor.execute(
                    f"UPDATE user_sessions SET {', '.join(set_parts)} WHERE session_id = %s",
                    (access_token, access_expires_at, session_id),
                )
            conn.commit()

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
