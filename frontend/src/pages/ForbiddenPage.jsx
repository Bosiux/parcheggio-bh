// src/pages/ForbiddenPage.jsx
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--app-bg) 0%, var(--app-bg-mid) 50%, var(--app-bg-end) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.5rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div style={{ fontSize: 80 }}><img src="/forbidden.svg" alt="Aree" style={{ width: 240, height: 240, display: "block", objectFit: "contain" }} /></div>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
        Accesso Negato
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 400 }}>
        Non hai i permessi necessari per visualizzare questa pagina.
      </p>
      <Button
        onPress={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}
        style={{ background: "linear-gradient(135deg, #bdb23c, #9b9b00)", color: "white" }}
        size="lg"
      >
        Torna alla Dashboard
      </Button>
    </div>
  );
}
