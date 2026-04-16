from flask import Flask
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv
import os

load_dotenv()


def create_app():
    app = Flask(__name__)

    # ── Configurazione sicura ────────────────────────────────────────────────
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-cambia-in-produzione")

    # Sessioni server-side memorizzate in filesystem (nessun dato sensibile nel cookie)
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_FILE_DIR"] = os.path.join(os.path.dirname(__file__), "..", ".flask_session")
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_USE_SIGNER"] = True          # firma HMAC sul cookie di sessione
    app.config["SESSION_COOKIE_HTTPONLY"] = True      # non accessibile da JavaScript
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"    # protezione CSRF di base
    app.config["SESSION_COOKIE_SECURE"] = os.getenv("FLASK_ENV") == "production"  # True solo in HTTPS

    app.config["DATABASE_URL"] = os.getenv("DATABASE_URL")

    Session(app)

    CORS(
        app,
        supports_credentials=True,
        origins=os.getenv("FRONTEND_URL", "http://localhost:5173"),
    )

    from app.routes.api import api_bp
    app.register_blueprint(api_bp)

    return app
