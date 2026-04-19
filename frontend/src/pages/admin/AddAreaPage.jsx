// src/pages/admin/AddAreaPage.jsx
import { useState } from "react";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { addArea } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";

const CARD_BASE = "!bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl";

const inputCls = {
  inputWrapper: "border-white/10 bg-white/[0.05] hover:!border-yellow-500/50 focus-within:!border-yellow-500",
  input: "!text-slate-100 placeholder:!text-slate-500",
  label: "!text-slate-400",
  description: "!text-slate-600",
};

export default function AddAreaPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ id: "", name: "", capacity: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (val) => { setForm((p) => ({ ...p, [field]: val })); setError(""); };

  const validate = () => {
    if (!form.id.trim()) return "L'ID area è obbligatorio.";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
      return "La capienza deve essere un numero >= 1.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      await addArea({ id: form.id.trim(), name: form.name.trim() || undefined, capacity: Number(form.capacity) });
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
        <h1 style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Aggiungi Area Parcheggio
        </h1>
        <p style={{ color: "#64748b", marginBottom: "2rem" }}>
          Registra una nuova area nel sistema di gestione.
        </p>

        {success && (
          <div className="alert-success" style={{ marginBottom: "1.5rem", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img src="/check.svg" alt="OK" style={{ width: 22, height: 22, objectFit: "contain" }} />
              Area aggiunta con successo!
            </div>
            <Button
              size="sm" variant="flat" onPress={() => navigate("/admin")}
              style={{ color: "#15803d", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.36)", fontWeight: 700 }}
            >
              Torna al pannello
            </Button>
          </div>
        )}

        {error && (
          <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
            <img src="/attention.svg" alt="Errore" style={{ width: 22, height: 22, objectFit: "contain" }} /> {error}
          </div>
        )}

        <Card shadow="none" classNames={{ base: CARD_BASE }}>
          <CardBody style={{ padding: "2rem" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <Input
                id="area-id-input"
                label="ID Area *"
                placeholder="es. P01, CENTRO-A, BH-2"
                value={form.id}
                onValueChange={handleChange("id")}
                variant="bordered"
                description="Identificativo univoco dell'area (es. P01, NORD-1)"
                isDisabled={loading}
                classNames={inputCls}
                startContent={<img src="/tag.svg" alt="ID" style={{ width: 22, height: 22, objectFit: "contain" }} />}
              />
              <Input
                id="area-name-input"
                label="Nome area (opzionale)"
                placeholder="es. Parcheggio Centro Brescia"
                value={form.name}
                onValueChange={handleChange("name")}
                variant="bordered"
                description="Nome descrittivo visibile agli utenti"
                isDisabled={loading}
                classNames={inputCls}
                startContent={<img src="/area.svg" alt="Nome" style={{ width: 22, height: 22, objectFit: "contain" }} />}
              />
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
                classNames={inputCls}
                startContent={<img src="/car.svg" alt="Capienza" style={{ width: 24, height: 24, objectFit: "contain" }} />}
              />

              {(form.id || form.capacity) && (
                <div style={{ background: "rgba(189,178,60,0.06)", border: "1px solid rgba(189,178,60,0.15)", borderRadius: 10, padding: "1rem" }}>
                  <p style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Anteprima</p>
                  <p style={{ color: "#e2e8f0", fontWeight: 600, margin: 0 }}>{form.name || `Parcheggio ${form.id}`}</p>
                  <p style={{ color: "#475569", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>ID: {form.id || "—"} · Capienza: {form.capacity || "—"} posti</p>
                </div>
              )}

              <Button
                id="add-area-submit"
                type="submit"
                isLoading={loading}
                fullWidth size="lg"
                className="font-bold text-white mt-1"
                style={{
                  background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                  height: 52,
                  boxShadow: "0 10px 30px rgba(189,178,60,0.3)",
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
