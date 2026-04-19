// src/pages/user/DashboardPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardFooter, Button, Chip, Spinner, Tooltip } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { getAreas } from "../../api/parking.api.js";
import Layout from "../../components/Layout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ParkingGeoMap from "../../components/ParkingGeoMap.jsx";

const CARD_BASE = "!bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl";

function AvailabilityBadge({ available, total }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  let color = "success", label = "Disponibile";
  if (pct === 0)   { color = "danger";  label = "Pieno"; }
  else if (pct < 30) { color = "warning"; label = "Quasi pieno"; }
  return <Chip color={color} variant="flat" size="sm">{available}/{total} posti — {label}</Chip>;
}

export default function DashboardPage() {
  const [areas, setAreas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchAreas = useCallback(async () => {
    try {
      setAreas(await getAreas());
      setError("");
    } catch (err) {
      setError(err.message || "Errore nel caricamento delle aree.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
    const id = setInterval(fetchAreas, 30000);
    return () => clearInterval(id);
  }, [fetchAreas]);

  const mapPoints = areas.map((area, i) => ({
    id: area.id,
    label: area.name || `Parcheggio ${area.id}`,
    available: Number(area.availableSpots ?? area.available ?? 0),
    occupied: 0, revenue: 0,
    isUnderMaintenance: Boolean(area.isUnderMaintenance),
    lat: Number(area.mapPoint?.lat ?? (45.53 + i * 0.003)),
    lng: Number(area.mapPoint?.lng ?? (10.21 + i * 0.003)),
  }));

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
          Benvenuto, {user?.username} 👋
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
          Visualizza la disponibilità delle aree e prenota il tuo posto.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Aree disponibili ({areas.length})
        </h2>
        <Tooltip content="Aggiorna ora" placement="left">
          <Button
            size="sm"
            variant="flat"
            onPress={fetchAreas}
            isLoading={loading}
            style={{
              color: "#bdb23c",
              background: "rgba(189,178,60,0.14)",
              border: "1px solid rgba(189,178,60,0.35)",
              fontWeight: 600,
            }}
          >
            <img src="/update.svg" alt="Aggiorna" style={{ width: 20, height: 20, objectFit: "contain" }} />
            Aggiorna
          </Button>
        </Tooltip>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
          <img src="/attention.svg" alt="Errore" style={{ width: 22, height: 22, objectFit: "contain" }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && areas.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="warning" label="Caricamento aree..." />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && areas.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#475569" }}>
          <img src="/nopark.svg" alt="Nessuna area" style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto 1rem" }} />
          <h3 style={{ color: "#64748b" }}>Nessuna area disponibile</h3>
          <p>Non ci sono aree parcheggio attive al momento.</p>
        </div>
      )}

      {/* Map */}
      {areas.length > 0 && (
        <ParkingGeoMap
          mode="user"
          title="Mappa parcheggi"
          subtitle="Vista geografica con i posti disponibili per area"
          points={mapPoints}
        />
      )}

      {/* Areas grid */}
      {areas.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {areas.map((area) => {
            const available = area.availableSpots ?? area.available ?? 0;
            const total     = area.capacity ?? area.total ?? 0;
            const isUnderMaintenance = Boolean(area.isUnderMaintenance);
            const hourlyRate = Number(area.hourlyRate ?? 0);
            const isFull     = available === 0;
            const isBookable = !isUnderMaintenance && !isFull;
            const pct        = total > 0 ? Math.round((available / total) * 100) : 0;

            return (
              <Card
                key={area.id}
                shadow="none"
                classNames={{
                  base: `${CARD_BASE} transition-all duration-200 ${
                    isFull
                      ? "opacity-70 !border-red-500/20"
                      : "hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(189,178,60,0.2)] !border-yellow-500/15"
                  }`,
                }}
                style={{ cursor: isFull ? "not-allowed" : "pointer" }}
              >
                <CardBody style={{ padding: "1.5rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <img src="/park.svg" alt="Area" style={{ width: 18, height: 18, objectFit: "contain" }} />
                        <span style={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          AREA {area.id}
                        </span>
                      </div>
                      <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
                        {area.name || `Parcheggio ${area.id}`}
                      </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                      <AvailabilityBadge available={available} total={total} />
                      {isUnderMaintenance && <Chip size="sm" color="warning" variant="flat">In manutenzione</Chip>}
                    </div>
                  </div>

                  {/* Availability bar */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Disponibilità</span>
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 99,
                        background: pct === 0 ? "#ef4444" : pct < 30 ? "#f59e0b" : "linear-gradient(90deg,#bdb23c,#9b9b00)",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                    {[
                      { label: "Liberi",   value: available,          color: "#22c55e" },
                      { label: "Occupati", value: total - available,  color: "#ef4444" },
                      { label: "Totale",   value: total,              color: "#94a3b8" },
                      { label: "Tariffa",  value: isUnderMaintenance ? "Sospesa" : `€${hourlyRate.toFixed(2)}/h`, color: "#bdb23c" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ color: "#64748b", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ color, fontWeight: 700, fontSize: "1.2rem" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Price preview */}
                  <div style={{
                    background: "rgba(189,178,60,0.08)", border: "1px solid rgba(189,178,60,0.20)",
                    borderRadius: 10, padding: "0.65rem 0.75rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem",
                  }}>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Stima rapida</span>
                    <span style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600 }}>
                      {isUnderMaintenance
                        ? "Costi non disponibili"
                        : `1h: €${(hourlyRate).toFixed(2)} · 2h: €${(hourlyRate * 2).toFixed(2)}`}
                    </span>
                  </div>
                </CardBody>

                <CardFooter style={{ padding: "0 1.5rem 1.5rem" }}>
                  <Button
                    id={`book-area-${area.id}`}
                    fullWidth
                    isDisabled={!isBookable}
                    onPress={() => navigate(`/booking/${area.id}`, { state: { area } })}
                    className="font-semibold text-white"
                    style={
                      isBookable
                        ? { background: "linear-gradient(135deg, #bdb23c, #9b9b00)", boxShadow: "0 8px 20px rgba(189,178,60,0.3)" }
                        : { background: "rgba(255,255,255,0.05)", color: "#475569" }
                    }
                  >
                    {isUnderMaintenance ? "Area in manutenzione" : isFull ? "Parcheggio pieno" : "Prenota ora →"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <p style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center", marginTop: "2rem" }}>
        Aggiornamento automatico ogni 30 secondi
      </p>
    </Layout>
  );
}
