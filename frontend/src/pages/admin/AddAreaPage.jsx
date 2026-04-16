// src/pages/admin/AddAreaPage.jsx
import { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { addArea } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";

const iconAlarmStyle = {
  width: 22,
  height: 22,
  display: "block",
  objectFit: "contain",
};

export default function AddAreaPage() {
  const navigate  = useNavigate();
  const [form, setForm] = useState({ id: "", name: "", capacity: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setError("");
  };

  const validate = () => {
    if (!form.id.trim()) return "L'ID area è obbligatorio.";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
      return "La capienza deve essere un numero >= 1.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");
    try {
      await addArea({
        id:       form.id.trim(),
        name:     form.name.trim() || undefined,
        capacity: Number(form.capacity),
      });
      setSuccess(true);
      setForm({ id: "", name: "", capacity: "" });
    } catch (err) {
      setError(err.message || "Errore durante la creazione dell'area.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Aggiungi Area Parcheggio
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Registra una nuova area nel sistema di gestione.
        </p>

        {/* Success banner */}
        {success && (
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              color: "#86efac",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{<img src="/check.svg" alt="Aree" style={{ width: 22, height: 22, display: "block", objectFit: "contain" }} />} Area aggiunta con successo!</span>
            <Button
              size="sm"
              variant="flat"
              onPress={() => navigate("/admin")}
              style={{
                color: "#15803d",
                background: "rgba(34,197,94,0.14)",
                border: "1px solid rgba(34,197,94,0.36)",
                fontWeight: 700,
              }}
            >
              Torna al pannello
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              color: "#fca5a5",
              marginBottom: "1.5rem",
            }}
          >
            {<img src="/attention.svg" alt="Errore" style={iconAlarmStyle} />} {error}
          </div>
        )}

        <Card
          style={{
            background: "var(--surface-04)",
            border: "1px solid var(--border-default)",
          }}
        >
          <CardBody style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* ID Area */}
              <Input
                id="area-id-input"
                label="ID Area *"
                placeholder="es. P01, CENTRO-A, BH-2"
                value={form.id}
                onValueChange={handleChange("id")}
                variant="bordered"
                description="Identificativo univoco dell'area (es. P01, NORD-1)"
                isDisabled={loading}
                classNames={{
                  inputWrapper: "border-white/10 bg-white/5 hover:border-yellow-500/50 focus-within:border-yellow-500",
                  input: "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  label: "text-[var(--text-muted)]",
                  description: "text-[var(--text-subtle)]",
                }}
                startContent={<span style={{ color: "#bdb23c" }}>{<img src="/tag.svg" alt="ID Area" style={{ width: 22, height: 22, display: "block", objectFit: "contain" }} />}</span>}
              />

              {/* Nome (opzionale) */}
              <Input
                id="area-name-input"
                label="Nome area (opzionale)"
                placeholder="es. Parcheggio Centro Brescia"
                value={form.name}
                onValueChange={handleChange("name")}
                variant="bordered"
                description="Nome descrittivo visibile agli utenti"
                isDisabled={loading}
                classNames={{
                  inputWrapper: "border-white/10 bg-white/5 hover:border-yellow-500/50 focus-within:border-yellow-500",
                  input: "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  label: "text-[var(--text-muted)]",
                  description: "text-[var(--text-subtle)]",
                }}
                startContent={<span style={{ color: "#9b9b00" }}>{<img src="/area.svg" alt="Aree" style={{ width: 22, height: 22, display: "block", objectFit: "contain" }} />}</span>}
              />

              {/* Capienza */}
              <Input
                id="area-capacity-input"
                label="Capienza massima *"
                placeholder="es. 50"
                type="number"
                min="1"
                value={form.capacity}
                onValueChange={handleChange("capacity")}
                variant="bordered"
                description="Numero totale di posti auto nell'area"
                isDisabled={loading}
                classNames={{
                  inputWrapper: "border-white/10 bg-white/5 hover:border-yellow-500/50 focus-within:border-yellow-500",
                  input: "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  label: "text-[var(--text-muted)]",
                  description: "text-[var(--text-subtle)]",
                }}
                startContent={<span style={{ color: "#7f7800" }}>{<img src="/car.svg" alt="Capienza" style={{ width: 26, height: 26, display: "block", objectFit: "contain" }} />}</span>}
              />

              {/* Preview */}
              {(form.id || form.capacity) && (
                <div
                  style={{
                    background: "rgba(189,178,60,0.06)",
                    border: "1px solid rgba(189,178,60,0.15)",
                    borderRadius: 10,
                    padding: "1rem",
                  }}
                >
                  <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Anteprima
                  </p>
                  <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
                    {form.name || `Parcheggio ${form.id}`}
                  </p>
                  <p style={{ color: "var(--text-subtle)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
                    ID: {form.id || "—"} · Capienza: {form.capacity || "—"} posti
                  </p>
                </div>
              )}

              <Button
                id="add-area-submit"
                type="submit"
                isLoading={loading}
                fullWidth
                size="lg"
                style={{
                  background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                  color: "white",
                  fontWeight: 700,
                  height: 52,
                  boxShadow: "0 10px 30px rgba(189,178,60,0.3)",
                  marginTop: "0.5rem",
                }}
              >
                {loading ? "Creazione in corso..." : "Aggiungi Area"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
