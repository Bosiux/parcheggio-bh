// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { login as apiLogin } from "../api/auth.api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { img } from "framer-motion/client";

const iconStyle = {
  width: 22,
  height: 22,
  display: "block",
  objectFit: "contain",
};
const iconAlarmStyle = {
  width: 35,
  height: 35,
  display: "block",
  objectFit: "contain",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const isAllowedPathForRole = (path, role) => {
    if (!path) return false;
    if (role === "admin") return path.startsWith("/admin");
    return path === "/" || path === "/dashboard" || path.startsWith("/booking/") || path === "/history";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Inserisci username e password.");
      return;
    }
    setLoading(true);
    try {
      const userData = await apiLogin(username.trim(), password);
      login(userData);
      // Usa il redirect precedente solo se compatibile col ruolo.
      if (isAllowedPathForRole(from, userData.role)) {
        navigate(from, { replace: true });
      } else if (userData.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Credenziali non valide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--app-bg) 0%, var(--app-bg-mid) 50%, var(--app-bg-end) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "15%",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(189,178,60,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          right: "15%",
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(155,155,0,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              margin: "0 auto 1rem",
              
            }}
          >
            <img src="/logoPBH.svg" alt="Logo" />
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #bcb13d, #898025, #807613)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            ParcheggiBH
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
            Comune di Brescia — Servizio di Parcheggi
          </p>
        </div>

        {/* Login Card */}
        <Card
          className="glass-card"
          style={{
            background: "var(--surface-04)",
            border: "1px solid var(--border-default)",
          }}
        >
          <CardBody style={{ padding: "2rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              Accedi al portale
            </h2>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: "0.875rem 1rem",
                  marginBottom: "1.25rem",
                  color: "#fca5a5",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <img src="/attention.svg" alt="Errore" style={iconAlarmStyle} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                id="login-username"
                label="Username"
                labelPlacement="outside"
                placeholder="Inserisci il tuo username"
                value={username}
                onValueChange={setUsername}
                variant="bordered"
                classNames={{
                  inputWrapper: "border-[var(--border-default)] bg-[var(--login-input-bg)] hover:border-yellow-500/50 focus-within:border-yellow-500",
                  input: "!text-[var(--text-primary)] !font-medium placeholder:!text-[var(--text-secondary)]",
                  label: "!text-[var(--login-label-color)] !opacity-100 mb-1 font-bold",
                }}
                startContent={<span style={{ color: "#bdb23c", fontSize: 19, marginRight: 6 }}><img src="/user.svg" alt="Username" style={iconStyle} /></span>}
                isDisabled={loading}
                autoComplete="username"
              />

              <Input
                id="login-password"
                label="Password"
                labelPlacement="outside"
                placeholder="Inserisci la tua password"
                value={password}
                onValueChange={setPassword}
                type={showPassword ? "text" : "password"}
                variant="bordered"
                classNames={{
                  inputWrapper: "border-[var(--border-default)] bg-[var(--login-input-bg)] hover:border-yellow-500/50 focus-within:border-yellow-500",
                  input: "!text-[var(--text-primary)] !font-medium placeholder:!text-[var(--text-secondary)]",
                  label: "!text-[var(--login-label-color)] !opacity-100 mb-1 font-bold",
                }}
                startContent={<span style={{ color: "#bdb23c", fontSize: 19, marginRight: 6 }}><img src="/pw.svg" alt="Password" style={iconStyle} /></span>}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, fontSize: 19     }}
                  >
                    {showPassword ? <img src="/hide.svg" alt="Nascondi password" style={iconStyle} /> : <img src="/show.svg" alt="Mostra password" style={iconStyle} />}
                  </button>
                }
                isDisabled={loading}
                autoComplete="current-password"
              />

              <Button
                id="login-submit"
                type="submit"
                isLoading={loading}
                style={{
                  background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                  color: "white",
                  fontWeight: 600,
                  height: 48,
                  fontSize: "1rem",
                  marginTop: "0.5rem",
                  boxShadow: "0 10px 30px rgba(189,178,60,0.3)",
                }}
                size="lg"
                fullWidth
              >
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-subtle)",
            fontSize: "0.8rem",
            marginTop: "1.5rem",
          }}
        >
          © 2026 Comune di Brescia — ParcheggiBH
        </p>
      </div>
    </div>
  );
}
