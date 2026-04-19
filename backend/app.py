import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from extensions import limiter
from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.parking import parking_bp

logging.basicConfig(level=logging.DEBUG)


def create_app() -> Flask:
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

    app = Flask(__name__)
    CORS(
        app,
        resources={r"/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True,
    )

    limiter.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(parking_bp)
    app.register_blueprint(admin_bp)

    @app.get("/health")
    def healthcheck():
        return jsonify({"ok": True}), 200

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    app.run(host="0.0.0.0", port=port, debug=True)