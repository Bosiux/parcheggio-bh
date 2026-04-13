
from flask import Blueprint, request, jsonify
import uuid

api_bp = Blueprint("api", __name__)

users = [
    {
        "id": "1",
        "username": "admin",
        "password": "1234",
        "role": "admin"
    },
    {
        "id": "2",
        "username": "user",
        "password": "1234",
        "role": "user"
    }
]

sessions = {}


@api_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return {"error": "username e password richiesti"}, 400

    for user in users:
        if user["username"] == data["username"] and user["password"] == data["password"]:

            token = str(uuid.uuid4())

            sessions[token] = {
                "user_id": user["id"],
                "role": user["role"]
            }

            return {
                "message": "login ok",
                "token": token,
                "role": user["role"]
            }

    return {"error": "credenziali errate"}, 401


def get_current_user():
    token = request.headers.get("Authorization")

    if not token:
        return None

    return sessions.get(token)


@api_bp.route("/api/users", methods=["GET"])
def get_users():
    session = get_current_user()

    if not session:
        return {"error": "non autenticato"}, 401

    if session["role"] != "admin":
        return {"error": "solo admin"}, 403

    return jsonify(users)

@api_bp.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    session = get_current_user()

    if not session:
        return {"error": "non autenticato"}, 401

    if session["role"] == "admin":
        for u in users:
            if u["id"] == user_id:
                return u
        return {"error": "utente non trovato"}, 404

    if session["user_id"] == user_id:
        for u in users:
            if u["id"] == user_id:
                return u
        return {"error": "utente non trovato"}, 404

    return {"error": "non autorizzato"}, 403


@api_bp.route("/api/user", methods=["POST"])
def create_user():
    session = get_current_user()

    if not session:
        return {"error": "non autenticato"}, 401

    if session["role"] != "admin":
        return {"error": "solo admin"}, 403

    data = request.get_json()

    nuovo = {
        "id": str(uuid.uuid4()),
        "username": data["username"],
        "password": data["password"],
        "role": data.get("role", "user")
    }

    users.append(nuovo)
    return nuovo, 201


@api_bp.route("/api/user/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    session = get_current_user()

    if not session:
        return {"error": "non autenticato"}, 401

    if session["role"] != "admin":
        return {"error": "solo admin"}, 403

    for u in users:
        if u["id"] == user_id:
            users.remove(u)
            return {"message": "utente eliminato"}

    return {"error": "utente non trovato"}, 404

