// src/pages/ForbiddenPage.jsx
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8"
      style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0d1b2a 50%, #0a0a1a 100%)" }}
    >
      <img src="/forbidden.svg" alt="Accesso negato" style={{ width: 220, height: 220, objectFit: "contain" }} />
      <h1 className="text-4xl font-extrabold m-0" style={{ color: "#e2e8f0" }}>Accesso Negato</h1>
      <p className="text-lg max-w-sm m-0" style={{ color: "#64748b" }}>
        Non hai i permessi necessari per visualizzare questa pagina.
      </p>
      <Button
        size="lg"
        className="font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #bdb23c, #9b9b00)" }}
        onPress={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")}
      >
        Torna alla Dashboard
      </Button>
    </div>
  );
}
