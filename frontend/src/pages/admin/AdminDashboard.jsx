// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner, Chip } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { getAllAreas, getAllBookings } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ParkingGeoMap from "../../components/ParkingGeoMap.jsx";

const CARD_BASE = "!bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl";

function StatCard({ icon, label, value, color, onClick, id }) {
  return (
    <Card
      id={id}
      isPressable={!!onClick}
      onPress={onClick}
      shadow="none"
      classNames={{ base: `${CARD_BASE} transition-all ${onClick ? "hover:-translate-y-0.5 cursor-pointer" : ""}` }}
    >
      <CardBody style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{label}</p>
            <p style={{ color, fontWeight: 800, fontSize: "2.25rem", margin: 0 }}>{value}</p>
          </div>
          <div style={{ width: 48, height: 48, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
        </div>
        {onClick && <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.75rem" }}>Clicca per vedere →</p>}
      </CardBody>
    </Card>
  );
}

function NavCard({ icon, title, description, path, color }) {
  const navigate = useNavigate();
  return (
    <Card
      isPressable
      onPress={() => navigate(path)}
      shadow="none"
      classNames={{ base: `${CARD_BASE} transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(189,178,60,0.15)] cursor-pointer` }}
    >
      <CardBody style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ width: 52, height: 52, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div>
          <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1rem", margin: "0 0 0.25rem" }}>{title}</h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>{description}</p>
        </div>
        <div style={{ color, fontSize: "0.8rem", fontWeight: 600 }}>Vai →</div>
      </CardBody>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [areas, setAreas]       = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [a, b] = await Promise.allSettled([getAllAreas(), getAllBookings()]);
        if (a.status === "fulfilled") setAreas(a.value);
        if (b.status === "fulfilled") setBookings(b.value);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
  const endOfDay   = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);

  const computeDailyRevenue = (booking, fallback) => {
    if (booking?.status === "cancelled") return 0;
    const s = new Date(booking.startTime), e = new Date(booking.endTime);
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    const os = new Date(Math.max(s, startOfDay)), oe = new Date(Math.min(e, endOfDay, now));
    if (oe <= os) return 0;
    return ((oe - os) / 3600000) * Number(booking.hourlyRate ?? fallback ?? 0);
  };

  const mapPoints = areas.map((area, i) => {
    const isMaint   = Boolean(area.isUnderMaintenance);
    const available = isMaint ? 0 : Number(area.availableSpots ?? area.available ?? 0);
    const capacity  = Number(area.capacity ?? area.total ?? 0);
    const occupied  = isMaint ? 0 : Math.max(0, capacity - available);
    const rate      = Number(area.hourlyRate ?? 0);
    const bRev      = isMaint ? 0 : bookings.filter((b) => b.areaId === area.id).reduce((s, b) => s + computeDailyRevenue(b, rate), 0);
    return {
      id: area.id, label: area.name || `Parcheggio ${area.id}`,
      available, occupied, revenue: Number(Math.max(bRev, isMaint ? 0 : occupied * rate).toFixed(2)),
      isUnderMaintenance: isMaint,
      lat: Number(area.mapPoint?.lat ?? (45.53 + i * 0.003)),
      lng: Number(area.mapPoint?.lng ?? (10.21 + i * 0.003)),
    };
  });

  const activeBookings = bookings.filter((b) => b.status === "active").length;
  const totalCapacity  = areas.reduce((s, a) => s + (a.capacity ?? a.total ?? 0), 0);
  const totalAvailable = areas.reduce((s, a) => s + (a.availableSpots ?? a.available ?? 0), 0);
  const occupancyPct   = totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0;

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Chip size="sm" color="secondary" variant="flat">Admin</Chip>
          <span style={{ color: "#475569", fontSize: "0.875rem" }}>Pannello di controllo</span>
        </div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
          Benvenuto, {user?.username} 👋
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
          Gestisci le aree parcheggio e monitora le prenotazioni in tempo reale.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Spinner size="lg" color="secondary" label="Caricamento dati..." />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <StatCard id="stat-areas"
              icon={<img src="/area.svg"       alt="Aree"       style={{ width: 40, height: 40, objectFit: "contain" }} />}
              label="Aree Totali"      value={areas.length}     color="#bdb23c" onClick={() => navigate("/admin/bookings")} />
            <StatCard id="stat-bookings"
              icon={<img src="/reservation.svg" alt="Prenotazioni" style={{ width: 32, height: 32, objectFit: "contain" }} />}
              label="Prenotazioni Oggi" value={bookings.length}  color="#9b9b00" onClick={() => navigate("/admin/bookings")} />
            <StatCard id="stat-active"
              icon={<img src="/check.svg"      alt="Attive"     style={{ width: 32, height: 32, objectFit: "contain" }} />}
              label="Attive Ora"       value={activeBookings}   color="#22c55e" />
            <StatCard id="stat-occ"
              icon={<img src="/statistics.svg" alt="Occupazione" style={{ width: 32, height: 32, objectFit: "contain" }} />}
              label="Occupazione %"    value={`${occupancyPct}%`} color="#f59e0b" />
          </div>

          {/* Occupancy bar */}
          <Card shadow="none" classNames={{ base: `${CARD_BASE} mb-8` }}>
            <CardBody style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>Occupazione globale</span>
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{totalCapacity - totalAvailable} / {totalCapacity} posti occupati</span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${occupancyPct}%`, borderRadius: 99, transition: "width 0.6s ease",
                  background: occupancyPct > 80 ? "linear-gradient(90deg,#ef4444,#dc2626)"
                    : occupancyPct > 50 ? "linear-gradient(90deg,#f59e0b,#d97706)"
                    : "linear-gradient(90deg,#bdb23c,#9b9b00)",
                }} />
              </div>
            </CardBody>
          </Card>

          <ParkingGeoMap
            mode="admin"
            title="Mappa operativa parcheggi"
            subtitle="Ogni geopoint mostra posti liberi, posti occupati e ricavi giornalieri"
            points={mapPoints}
          />
        </>
      )}

      {/* Quick access */}
      <h2 style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
        Accesso Rapido
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <NavCard icon={<img src="/addGeo.svg"         alt="Aggiungi"      style={{ width: 40, height: 40, objectFit: "contain" }} />} title="Aggiungi Area"          description="Registra una nuova area parcheggio nel sistema."          path="/admin/add-area"     color="#bdb23c" />
        <NavCard icon={<img src="/area.svg"            alt="Gestisci"      style={{ width: 40, height: 40, objectFit: "contain" }} />} title="Gestisci Aree"          description="Visualizza e modifica ID, nome, capienza e disponibilità." path="/admin/manage-areas" color="#b39d2a" />
        <NavCard icon={<img src="/reservationList.svg" alt="Prenotazioni"  style={{ width: 40, height: 40, objectFit: "contain" }} />} title="Tutte le Prenotazioni"  description="Visualizza e filtra lo storico globale delle prenotazioni." path="/admin/bookings"    color="#9b9b00" />
        <NavCard icon={<img src="/statistics.svg"      alt="Statistiche"   style={{ width: 36, height: 36, objectFit: "contain" }} />} title="Statistiche"             description="Analizza l'andamento giornaliero degli ultimi 30 giorni."  path="/admin/stats"       color="#7f7800" />
      </div>
    </Layout>
  );
}
