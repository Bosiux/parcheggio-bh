from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["DATABASE_URL"] = os.getenv("DATABASE_URL")

    CORS(app, supports_credentials=True, origins=os.getenv("FRONTEND_URL", "http://localhost:5173"))

    from app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
