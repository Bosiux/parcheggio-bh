import os
import secrets
from datetime import datetime, timedelta, timezone

import psycopg2
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor

from db import HAS_BOOKINGS_UPDATED_AT, HAS_COORDS, get_db_connection


parking_bp = Blueprint("parking", __name__, url_prefix="/parking")


def require_user(cursor):
    session_id = request.headers.get("X-Session-Id")
    if not session_id:
        return None, (jsonify({"message": "Sessione non valida."}), 401)

    cursor.execute(
        """
        SELECT u.id, u.username, u.role
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.session_id = %s
          AND s.refresh_token_expires_at > NOW()
        """,
        (session_id,),
    )
    user_row = cursor.fetchone()
    if not user_row:
        return None, (jsonify({"message": "Sessione non autorizzata."}), 401)

    return user_row, None


def build_map_point(row):
    if HAS_COORDS and row.get("lat") is not None and row.get("lng") is not None:
        return {"lat": float(row["lat"]), "lng": float(row["lng"])}
    return None


def build_booking_payload(row):
    duration_hours = int((row["end_time"] - row["start_time"]).total_seconds() // 3600)
    return {
        "id": row["id"],
        "areaId": row["area_id"],
        "areaName": row["area_name"],
        "startTime": row["start_time"].isoformat(),
        "endTime": row["end_time"].isoformat(),
        "durationHours": duration_hours,
        "hourlyRate": float(row["hourly_rate"]),
        "totalPrice": float(row["total_price"]),
        "status": row["status"],
    }


@parking_bp.get("/areas")
def get_areas():
    try:
        coord_select = ", a.lat, a.lng" if HAS_COORDS else ""
        coord_group = ", a.lat, a.lng" if HAS_COORDS else ""
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    f"""
                    SELECT
                        a.id,
                        a.name,
                        a.capacity,
                        a.hourly_rate,
                        a.is_under_maintenance
                        {coord_select},
                        GREATEST(
                            a.capacity - COUNT(b.id) FILTER (
                                WHERE b.status = 'active' AND b.end_time > NOW()
                            ),
                            0
                        ) AS available_spots
                    FROM parking_areas a
                    LEFT JOIN bookings b ON b.area_id = a.id
                    GROUP BY a.id, a.name, a.capacity, a.hourly_rate, a.is_under_maintenance{coord_group}
                    ORDER BY a.id
                    """
                )
                rows = cursor.fetchall()

        return (
            jsonify(
                [
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "capacity": row["capacity"],
                        "hourlyRate": float(row["hourly_rate"]),
                        "availableSpots": 0 if row["is_under_maintenance"] else int(row["available_spots"]),
                        "isUnderMaintenance": bool(row["is_under_maintenance"]),
                        "mapPoint": build_map_point(row),
                    }
                    for row in rows
                ]
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"message": "Errore caricamento aree.", "error": str(exc)}), 500


@parking_bp.get("/areas/<string:area_id>/availability")
def get_area_availability(area_id):
    try:
        coord_select = ", a.lat, a.lng" if HAS_COORDS else ""
        coord_group = ", a.lat, a.lng" if HAS_COORDS else ""
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    f"""
                    SELECT
                        a.id,
                        a.name,
                        a.capacity,
                        a.hourly_rate,
                        a.is_under_maintenance
                        {coord_select},
                        GREATEST(
                            a.capacity - COUNT(b.id) FILTER (
                                WHERE b.status = 'active' AND b.end_time > NOW()
                            ),
                            0
                        ) AS available_spots
                    FROM parking_areas a
                    LEFT JOIN bookings b ON b.area_id = a.id
                    WHERE a.id = %s
                    GROUP BY a.id, a.name, a.capacity, a.hourly_rate, a.is_under_maintenance{coord_group}
                    """,
                    (area_id.upper(),),
                )
                row = cursor.fetchone()

        if not row:
            return jsonify({"message": "Area non trovata."}), 404

        return (
            jsonify(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "capacity": row["capacity"],
                    "hourlyRate": float(row["hourly_rate"]),
                    "availableSpots": 0 if row["is_under_maintenance"] else int(row["available_spots"]),
                    "isUnderMaintenance": bool(row["is_under_maintenance"]),
                    "mapPoint": build_map_point(row),
                }
            ),
            200,
        )
    except Exception as exc:
        return jsonify({"message": "Errore disponibilita area.", "error": str(exc)}), 500


@parking_bp.post("/areas/<string:area_id>/book")
def book_area(area_id):
    payload = request.get_json(silent=True) or {}
    duration_hours = int(payload.get("durationHours", 1) or 1)
    start_date = str(payload.get("startDate", "")).strip()
    start_hour = str(payload.get("startHour", "")).strip()

    if duration_hours < 1 or duration_hours > 24:
        return jsonify({"message": "La durata deve essere tra 1 e 24 ore."}), 400

    try:
        if start_date and start_hour:
            start_time = datetime.fromisoformat(f"{start_date}T{start_hour}:00").replace(tzinfo=timezone.utc)
        else:
            start_time = datetime.now(timezone.utc)
    except ValueError:
        return jsonify({"message": "Data o ora non valida."}), 400

    end_time = start_time + timedelta(hours=duration_hours)

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                user, auth_error = require_user(cursor)
                if auth_error:
                    return auth_error

                cursor.execute(
                    """
                    SELECT id, name, capacity, hourly_rate, is_under_maintenance
                    FROM parking_areas
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (area_id.upper(),),
                )
                area_row = cursor.fetchone()
                if not area_row:
                    return jsonify({"message": "Area non trovata."}), 404
                if area_row["is_under_maintenance"]:
                    return jsonify({"message": "Area in manutenzione."}), 409

                cursor.execute(
                    """
                    SELECT COUNT(*) AS active_count
                    FROM bookings
                    WHERE area_id = %s
                      AND status = 'active'
                      AND end_time > NOW()
                    """,
                    (area_row["id"],),
                )
                active_count = int(cursor.fetchone()["active_count"])
                available_spots = max(int(area_row["capacity"]) - active_count, 0)
                if available_spots <= 0:
                    return jsonify({"message": "Nessun posto disponibile."}), 409

                total_price = float(area_row["hourly_rate"]) * duration_hours
                booking_id = f"BK{secrets.randbelow(90000) + 10000}"
                cursor.execute(
                    """
                    INSERT INTO bookings (
                        id,
                        user_id,
                        area_id,
                        start_time,
                        end_time,
                        duration_hours,
                        hourly_rate,
                        total_price,
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
                    RETURNING id, area_id, start_time, end_time, duration_hours, hourly_rate, total_price, status
                    """,
                    (
                        booking_id,
                        user["id"],
                        area_row["id"],
                        start_time,
                        end_time,
                        duration_hours,
                        area_row["hourly_rate"],
                        total_price,
                    ),
                )
                booking_row = cursor.fetchone()
                conn.commit()

        return (
            jsonify(
                {
                    "id": booking_row["id"],
                    "areaId": booking_row["area_id"],
                    "areaName": area_row["name"],
                    "startTime": booking_row["start_time"].isoformat(),
                    "endTime": booking_row["end_time"].isoformat(),
                    "durationHours": booking_row["duration_hours"],
                    "hourlyRate": float(booking_row["hourly_rate"]),
                    "totalPrice": float(booking_row["total_price"]),
                    "status": booking_row["status"],
                }
            ),
            201,
        )
    except Exception as exc:
        return jsonify({"message": "Errore creazione prenotazione.", "error": str(exc)}), 500


@parking_bp.get("/bookings/me")
def get_my_bookings():
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                user, auth_error = require_user(cursor)
                if auth_error:
                    return auth_error

                expire_set = "status = 'expired', updated_at = NOW()" if HAS_BOOKINGS_UPDATED_AT else "status = 'expired'"
                cursor.execute(f"UPDATE bookings SET {expire_set} WHERE status = 'active' AND end_time <= NOW()")

                cursor.execute(
                    """
                    SELECT
                        b.id,
                        b.area_id,
                        a.name AS area_name,
                        b.start_time,
                        b.end_time,
                        b.hourly_rate,
                        b.total_price,
                        b.status
                    FROM bookings b
                    JOIN parking_areas a ON a.id = b.area_id
                    WHERE b.user_id = %s
                    ORDER BY b.start_time DESC
                    """,
                    (user["id"],),
                )
                rows = cursor.fetchall()
            conn.commit()

        return jsonify([build_booking_payload(row) for row in rows]), 200
    except Exception as exc:
        return jsonify({"message": "Errore caricamento prenotazioni.", "error": str(exc)}), 500


@parking_bp.post("/bookings/<string:booking_id>/cancel")
def cancel_booking(booking_id):
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                user, auth_error = require_user(cursor)
                if auth_error:
                    return auth_error

                cursor.execute(
                    "SELECT id, user_id, status FROM bookings WHERE id = %s",
                    (booking_id,),
                )
                booking = cursor.fetchone()
                if not booking:
                    return jsonify({"message": "Prenotazione non trovata."}), 404
                if booking["user_id"] != user["id"]:
                    return jsonify({"message": "Non autorizzato."}), 403
                if booking["status"] != "active":
                    return jsonify({"message": "Solo le prenotazioni attive possono essere cancellate."}), 409

                cancel_set = "status = 'cancelled', updated_at = NOW()" if HAS_BOOKINGS_UPDATED_AT else "status = 'cancelled'"
                cursor.execute(f"UPDATE bookings SET {cancel_set} WHERE id = %s", (booking_id,))
            conn.commit()

        return jsonify({"message": "Prenotazione cancellata."}), 200
    except Exception as exc:
        return jsonify({"message": "Errore cancellazione prenotazione.", "error": str(exc)}), 500
