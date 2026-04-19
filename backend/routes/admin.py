import logging
import os

import psycopg2
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor

from db import HAS_AREAS_UPDATED_AT, HAS_COORDS, get_db_connection

logger = logging.getLogger(__name__)


admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def require_admin(cursor):
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
    if user_row["role"] != "admin":
        return None, (jsonify({"message": "Accesso negato: solo admin."}), 403)

    return user_row, None


def build_area_payload(row):
    payload = {
        "id": row["id"],
        "name": row["name"],
        "capacity": int(row["capacity"]),
        "availableSpots": int(row.get("available_spots", row["capacity"])),
        "hourlyRate": float(row["hourly_rate"]),
        "isUnderMaintenance": bool(row["is_under_maintenance"]),
        "mapPoint": (
            {"lat": float(row["lat"]), "lng": float(row["lng"])}
            if HAS_COORDS and row.get("lat") is not None and row.get("lng") is not None
            else None
        ),
    }
    return payload


@admin_bp.get("/areas")
def get_all_areas():
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                admin, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                coord_select = ", a.lat, a.lng" if HAS_COORDS else ""
                coord_group = ", a.lat, a.lng" if HAS_COORDS else ""
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

        return jsonify([build_area_payload(row) for row in rows]), 200
    except Exception as exc:
        logger.exception("Errore GET /admin/areas")
        return jsonify({"message": "Errore caricamento aree admin.", "error": str(exc)}), 500


@admin_bp.post("/areas")
def add_area():
    payload = request.get_json(silent=True) or {}
    area_id = str(payload.get("id", "")).strip().upper()
    name = str(payload.get("name", "")).strip()
    capacity = int(payload.get("capacity", 0) or 0)
    hourly_rate = float(payload.get("hourlyRate", 0) or 0)
    is_under_maintenance = bool(payload.get("isUnderMaintenance", False))
    lat = payload.get("lat")
    lng = payload.get("lng")

    if not area_id:
        return jsonify({"message": "ID area obbligatorio."}), 400
    if capacity < 1:
        return jsonify({"message": "Capienza deve essere >= 1."}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                if HAS_COORDS:
                    ins_cols = "id, name, capacity, hourly_rate, is_under_maintenance, lat, lng"
                    ins_vals = "%s, %s, %s, %s, %s, %s, %s"
                    ins_params = (area_id, name, capacity, hourly_rate, is_under_maintenance,
                                  float(lat) if lat is not None else None,
                                  float(lng) if lng is not None else None)
                else:
                    ins_cols = "id, name, capacity, hourly_rate, is_under_maintenance"
                    ins_vals = "%s, %s, %s, %s, %s"
                    ins_params = (area_id, name, capacity, hourly_rate, is_under_maintenance)

                ret_cols = "id, name, capacity, hourly_rate, is_under_maintenance" + (", lat, lng" if HAS_COORDS else "")
                cursor.execute(
                    f"INSERT INTO parking_areas ({ins_cols}) VALUES ({ins_vals}) RETURNING {ret_cols}",
                    ins_params,
                )
                row = cursor.fetchone()
            conn.commit()

        result = build_area_payload(row)
        result["availableSpots"] = int(row["capacity"])
        return jsonify(result), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({"message": "ID area gia esistente."}), 409
    except Exception as exc:
        logger.exception("Errore POST /admin/areas")
        return jsonify({"message": "Errore creazione area.", "error": str(exc)}), 500


@admin_bp.put("/areas/<string:area_id>")
def update_area(area_id):
    payload = request.get_json(silent=True) or {}

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                cursor.execute("SELECT * FROM parking_areas WHERE id = %s", (area_id.upper(),))
                current_row = cursor.fetchone()
                if not current_row:
                    return jsonify({"message": "Area non trovata."}), 404

                next_id = str(payload.get("id", current_row["id"])).strip().upper()
                next_name = str(payload.get("name", current_row["name"] or "")).strip()
                next_capacity = int(payload.get("capacity", current_row["capacity"]))
                next_hourly_rate = float(payload.get("hourlyRate", current_row["hourly_rate"]))
                next_maintenance = bool(payload.get("isUnderMaintenance", current_row["is_under_maintenance"]))
                if next_capacity < 1:
                    return jsonify({"message": "Capienza deve essere >= 1."}), 400

                set_parts = [
                    "id = %s", "name = %s", "capacity = %s",
                    "hourly_rate = %s", "is_under_maintenance = %s",
                ]
                upd_params = [next_id, next_name, next_capacity, next_hourly_rate, next_maintenance]
                if HAS_COORDS:
                    next_lat = float(payload["lat"]) if "lat" in payload and payload["lat"] is not None else current_row.get("lat")
                    next_lng = float(payload["lng"]) if "lng" in payload and payload["lng"] is not None else current_row.get("lng")
                    set_parts += ["lat = %s", "lng = %s"]
                    upd_params += [next_lat, next_lng]
                if HAS_AREAS_UPDATED_AT:
                    set_parts.append("updated_at = NOW()")
                upd_params.append(area_id.upper())

                returning_cols = "id, name, capacity, hourly_rate, is_under_maintenance"
                if HAS_COORDS:
                    returning_cols += ", lat, lng"

                cursor.execute(
                    f"UPDATE parking_areas SET {', '.join(set_parts)} WHERE id = %s RETURNING {returning_cols}",
                    upd_params,
                )
                row = cursor.fetchone()
            conn.commit()

        return jsonify(build_area_payload(row)), 200
    except psycopg2.errors.UniqueViolation:
        return jsonify({"message": "ID area gia esistente."}), 409
    except Exception as exc:
        logger.exception("Errore PUT /admin/areas")
        return jsonify({"message": "Errore aggiornamento area.", "error": str(exc)}), 500


@admin_bp.delete("/areas/<string:area_id>")
def delete_area(area_id):
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                cursor.execute("DELETE FROM parking_areas WHERE id = %s RETURNING id", (area_id.upper(),))
                deleted = cursor.fetchone()
            conn.commit()

        if not deleted:
            return jsonify({"message": "Area non trovata."}), 404

        return jsonify({"message": "Area eliminata."}), 200
    except Exception as exc:
        logger.exception("Errore DELETE /admin/areas")
        return jsonify({"message": "Errore eliminazione area.", "error": str(exc)}), 500


@admin_bp.get("/bookings")
def get_all_bookings():
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                cursor.execute(
                    """
                    SELECT
                        b.id,
                        b.user_id,
                        u.username,
                        b.area_id,
                        a.name AS area_name,
                        b.start_time,
                        b.end_time,
                        b.status,
                        b.total_price
                    FROM bookings b
                    JOIN users u ON u.id = b.user_id
                    JOIN parking_areas a ON a.id = b.area_id
                    ORDER BY b.start_time DESC
                    """
                )
                rows = cursor.fetchall()

        return (
            jsonify(
                [
                    {
                        "id": row["id"],
                        "userId": row["user_id"],
                        "user": {"username": row["username"]},
                        "areaId": row["area_id"],
                        "area": {"name": row["area_name"]},
                        "startTime": row["start_time"].isoformat(),
                        "endTime": row["end_time"].isoformat(),
                        "status": row["status"],
                        "totalPrice": float(row["total_price"]),
                    }
                    for row in rows
                ]
            ),
            200,
        )
    except Exception as exc:
        logger.exception("Errore GET /admin/bookings")
        return jsonify({"message": "Errore caricamento prenotazioni admin.", "error": str(exc)}), 500


@admin_bp.get("/stats/daily")
def get_daily_stats():
    area_id = request.args.get("areaId")
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                if area_id:
                    cursor.execute(
                        """
                        SELECT
                            to_char(d.day, 'YYYY-MM-DD') AS date,
                            COALESCE(COUNT(b.id), 0) AS count
                        FROM generate_series(
                            CURRENT_DATE - INTERVAL '29 days',
                            CURRENT_DATE,
                            INTERVAL '1 day'
                        ) AS d(day)
                        LEFT JOIN bookings b
                          ON DATE(b.start_time) = DATE(d.day)
                         AND b.area_id = %s
                        GROUP BY d.day
                        ORDER BY d.day
                        """,
                        (area_id.upper(),),
                    )
                else:
                    cursor.execute(
                        """
                        SELECT
                            to_char(d.day, 'YYYY-MM-DD') AS date,
                            COALESCE(COUNT(b.id), 0) AS count
                        FROM generate_series(
                            CURRENT_DATE - INTERVAL '29 days',
                            CURRENT_DATE,
                            INTERVAL '1 day'
                        ) AS d(day)
                        LEFT JOIN bookings b ON DATE(b.start_time) = DATE(d.day)
                        GROUP BY d.day
                        ORDER BY d.day
                        """
                    )
                rows = cursor.fetchall()

        return jsonify(rows), 200
    except Exception as exc:
        logger.exception("Errore GET /admin/stats/daily")
        return jsonify({"message": "Errore statistiche giornaliere.", "error": str(exc)}), 500


@admin_bp.get("/stats/revenue")
def get_revenue_stats():
    period = request.args.get("period", "30d")
    days = {"1d": 0, "7d": 6, "30d": 29}.get(period, 29)
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                _, auth_error = require_admin(cursor)
                if auth_error:
                    return auth_error

                cursor.execute(
                    """
                    SELECT
                        pa.id,
                        pa.name,
                        COALESCE(SUM(b.total_price), 0) AS revenue
                    FROM parking_areas pa
                    LEFT JOIN bookings b ON b.area_id = pa.id
                        AND b.status != 'cancelled'
                        AND b.start_time >= NOW() - %s * INTERVAL '1 day'
                    GROUP BY pa.id, pa.name
                    ORDER BY pa.id
                    """,
                    (days,),
                )
                rows = cursor.fetchall()

        return jsonify([
            {"id": row["id"], "name": row["name"], "revenue": float(row["revenue"])}
            for row in rows
        ]), 200
    except Exception as exc:
        logger.exception("Errore GET /admin/stats/revenue")
        return jsonify({"message": "Errore statistiche ricavi.", "error": str(exc)}), 500
