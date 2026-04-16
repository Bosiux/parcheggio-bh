// src/pages/user/DashboardPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Spinner,
  Tooltip,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { getAreas } from "../../api/parking.api.js";
import Layout from "../../components/Layout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ParkingGeoMap from "../../components/ParkingGeoMap.jsx";

function AvailabilityBadge({ available, total }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  let color = "success";
  let label = "Disponibile";
  if (pct === 0) { color = "danger"; label = "Pieno"; }
  else if (pct < 30) { color = "warning"; label = "Quasi pieno"; }

  return (
    <Chip color={color} variant="flat" size="sm">
      {available}/{total} posti — {label}
    </Chip>
  );
}

export default function DashboardPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchAreas = useCallback(async () => {
    try {
      const data = await getAreas();
      setAreas(data);
      setError("");
    } catch (err) {
      setError(err.message || "Errore nel caricamento delle aree.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
    // Auto-aggiornamento ogni 30 secondi
    const interval = setInterval(fetchAreas, 30000);
    return () => clearInterval(interval);
  }, [fetchAreas]);

  const mapPoints = areas.map((area, index) => ({
    id: area.id,
    label: area.name || `Parcheggio ${area.id}`,
    available: Number(area.availableSpots ?? area.available ?? 0),
    occupied: 0,
    revenue: 0,
    isUnderMaintenance: Boolean(area.isUnderMaintenance),
    lat: Number(area.mapPoint?.lat ?? (45.53 + index * 0.003)),
    lng: Number(area.mapPoint?.lng ?? (10.21 + index * 0.003)),
  }));

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Benvenuto, {user?.username} 👋
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Visualizza la disponibilità delle aree e prenota il tuo posto.
        </p>
      </div>

      {/* Refresh info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
            {<img src="/update.svg" alt="Aree" style={{ width: 22, height: 22, display: "block", objectFit: "contain" }} />}  Aggiorna
          </Button>
        </Tooltip>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            color: "#fca5a5",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <img src="/attention.svg" alt="Aree" style={{ width: 22, height: 22, display: "block", objectFit: "contain" }} /> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && areas.length === 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="primary" label="Caricamento aree..." />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && areas.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "var(--text-subtle)",
          }}
        >
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}><img src="/nopark.svg" alt="Aree" style={{ width: "clamp(72px, 18vw, 110px)", height: "clamp(72px, 18vw, 110px)", display: "block", objectFit: "contain" }} /></div>
          <h3 style={{ color: "var(--text-muted)" }}>Nessuna area disponibile</h3>
          <p>Non ci sono aree parcheggio attive al momento.</p>
        </div>
      )}

      {/* Areas grid */}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {areas.map((area) => {
            const available = area.availableSpots ?? area.available ?? 0;
            const total = area.capacity ?? area.total ?? 0;
            const isUnderMaintenance = Boolean(area.isUnderMaintenance);
            const hourlyRate = Number(area.hourlyRate ?? 0);
            const oneHourTotal = Number((hourlyRate * 1).toFixed(2));
            const twoHoursTotal = Number((hourlyRate * 2).toFixed(2));
            const isFull = available === 0;
            const isBookable = !isUnderMaintenance && !isFull;
            const pct = total > 0 ? Math.round((available / total) * 100) : 0;

            return (
              <Card
                key={area.id}
                className={`area-card glass-card ${isFull ? "" : ""}`}
                style={{
                  background: "var(--surface-04)",
                  border: isFull
                    ? "1px solid rgba(239,68,68,0.2)"
                    : "1px solid rgba(189,178,60,0.15)",
                  cursor: isFull ? "not-allowed" : "pointer",
                  opacity: isFull ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                <CardBody style={{ padding: "1.5rem" }}>
                  {/* Area header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: 20 }}><img src="/park.svg" alt="Aree" style={{ width: 20, height: 20, display: "block", objectFit: "contain" }} /></span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                          AREA {area.id}
                        </span>
                      </div>
                      <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
                        {area.name || `Parcheggio ${area.id}`}
                      </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                      <AvailabilityBadge available={available} total={total} />
                      {isUnderMaintenance && (
                        <Chip size="sm" color="warning" variant="flat">In manutenzione</Chip>
                      )}
                    </div>
                  </div>

                  {/* Availability bar */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Disponibilità</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "var(--border-default)", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: pct === 0
                            ? "#ef4444"
                            : pct < 30
                            ? "#f59e0b"
                            : "linear-gradient(90deg, #bdb23c, #9b9b00)",
                          borderRadius: 99,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Liberi</div>
                      <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "1.25rem" }}>{available}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Occupati</div>
                      <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "1.25rem" }}>{total - available}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Totale</div>
                      <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "1.25rem" }}>{total}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tariffa</div>
                      <div style={{ color: "#bdb23c", fontWeight: 700, fontSize: "1.1rem" }}>
                        {isUnderMaintenance ? "Sospesa" : `€ ${hourlyRate.toFixed(2)}/h`}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "0.9rem",
                      background: "rgba(189,178,60,0.08)",
                      border: "1px solid rgba(189,178,60,0.2)",
                      borderRadius: 10,
                      padding: "0.65rem 0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Stima rapida</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: 600 }}>
                      {isUnderMaintenance
                        ? "Costi non disponibili"
                        : `1h: € ${oneHourTotal.toFixed(2)} · 2h: € ${twoHoursTotal.toFixed(2)}`}
                    </span>
                  </div>
                </CardBody>

                <CardFooter style={{ padding: "0 1.5rem 1.5rem", paddingTop: 0 }}>
                  <Button
                    id={`book-area-${area.id}`}
                    fullWidth
                    isDisabled={!isBookable}
                    onPress={() => navigate(`/booking/${area.id}`, { state: { area } })}
                    style={
                      !isBookable
                        ? { background: "var(--surface-05)", color: "var(--text-subtle)" }
                        : {
                            background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                            color: "white",
                            fontWeight: 600,
                            boxShadow: "0 8px 20px rgba(189,178,60,0.3)",
                          }
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

      {/* Auto-refresh notice */}
      <p style={{ color: "var(--text-subtle)", fontSize: "0.75rem", textAlign: "center", marginTop: "2rem" }}>
          Aggiornamento automatico ogni 30 secondi
      </p>
    </Layout>
  );
}
