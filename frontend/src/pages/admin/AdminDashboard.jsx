// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner, Chip } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { getAllAreas } from "../../api/admin.api.js";
import { getAllBookings } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StatCard({ icon, label, value, color, onClick, id }) {
  return (
    <Card
      id={id}
      isPressable={!!onClick}
      onPress={onClick}
      style={{
        background: "var(--surface-04)",
        border: `1px solid var(--border-soft)`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
    >
      <CardBody style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              {label}
            </p>
            <p style={{ color, fontWeight: 800, fontSize: "2.25rem", margin: 0 }}>{value}</p>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              background: `${color}18`,
              border: `1px solid ${color}30`,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {icon}
          </div>
        </div>
        {onClick && (
          <p style={{ color: "var(--text-subtle)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
            Clicca per vedere →
          </p>
        )}
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
      style={{
        background: "var(--surface-04)",
        border: "1px solid var(--border-soft)",
        transition: "all 0.2s ease",
      }}
      className="area-card"
    >
      <CardBody style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", margin: "0 0 0.25rem" }}>
            {title}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>{description}</p>
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
        const [areasData, bookingsData] = await Promise.allSettled([
          getAllAreas(),
          getAllBookings(),
        ]);
        if (areasData.status === "fulfilled")    setAreas(areasData.value);
        if (bookingsData.status === "fulfilled") setBookings(bookingsData.value);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBookings = bookings.filter((b) => b.status === "active").length;
  const totalCapacity  = areas.reduce((sum, a) => sum + (a.capacity ?? a.total ?? 0), 0);
  const totalAvailable = areas.reduce((sum, a) => sum + (a.availableSpots ?? a.available ?? 0), 0);
  const occupancyPct   = totalCapacity > 0 ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100) : 0;

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Chip size="sm" color="secondary" variant="flat">Admin</Chip>
          <span style={{ color: "var(--text-subtle)", fontSize: "0.875rem" }}>Pannello di controllo</span>
        </div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Benvenuto, {user?.username} 👋
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Gestisci le aree parcheggio e monitora le prenotazioni in tempo reale.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Spinner size="lg" color="secondary" label="Caricamento dati..." />
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <StatCard
              id="stat-areas"
              icon={<img src="/area.svg" alt="Aree" style={{ width: 44, height: 44, display: "block", objectFit: "contain" }} />}
              label="Aree Totali"
              value={areas.length}
              color="#bdb23c"
              onClick={() => navigate("/admin/bookings")}
            />
            <StatCard
              id="stat-bookings"
              icon={<img src="/reservation.svg" alt="Prenotazioni" style={{ width: 34, height: 34, display: "block", objectFit: "contain" }} />}
              label="Prenotazioni Oggi"
              value={bookings.length}
              color="#9b9b00"
              onClick={() => navigate("/admin/bookings")}
            />
            <StatCard
              id="stat-active"
              icon={<img src="/check.svg" alt="Attive" style={{ width: 34, height: 34, display: "block", objectFit: "contain" }} />}
              label="Attive Ora"
              value={activeBookings}
              color="#22c55e"
            />
            <StatCard
              id="stat-occ"
              icon={<img src="/statistics.svg" alt="Occupazione" style={{ width: 34, height: 34, display: "block", objectFit: "contain" }} />}
              label="Occupazione %"
              value={`${occupancyPct}%`}
              color="#f59e0b"
            />
          </div>

          {/* Occupancy bar */}
          <Card
            style={{
              background: "var(--surface-04)",
              border: "1px solid var(--border-soft)",
              marginBottom: "2rem",
            }}
          >
            <CardBody style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Occupazione globale</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  {totalCapacity - totalAvailable} / {totalCapacity} posti occupati
                </span>
              </div>
              <div style={{ height: 10, background: "var(--surface-06)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${occupancyPct}%`,
                    background: occupancyPct > 80
                      ? "linear-gradient(90deg, #ef4444, #dc2626)"
                      : occupancyPct > 50
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #bdb23c, #9b9b00)",
                    borderRadius: 99,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Quick access cards */}
      <h2 style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
        Accesso Rapido
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <NavCard 
        icon={<img src="/addGeo.svg" alt="Aree" style={{ width: 44, height: 44, display: "block", objectFit: "contain" }} />} 
        title="Aggiungi Area"        
        description="Registra una nuova area parcheggio nel sistema."           
        path="/admin/add-area"  
        color="#bdb23c" />
        <NavCard 
        icon={<img src="/area.svg" alt="Gestisci Aree" style={{ width: 44, height: 44, display: "block", objectFit: "contain" }} />} 
        title="Gestisci Aree"        
        description="Visualizza e modifica ID, nome, capienza e disponibilita."           
        path="/admin/manage-areas"  
        color="#b39d2a" />
        <NavCard 
        icon={<img src="/reservationList.svg" alt="Prenotazioni" style={{ width: 44, height: 44, display: "block", objectFit: "contain" }} />} 
        title="Tutte le Prenotazioni" 
        description="Visualizza e filtra lo storico globale delle prenotazioni."  
        path="/admin/bookings"  
        color="#9b9b00" />
        <NavCard 
        icon={<img src="/statistics.svg" alt="Statistiche" style={{ width: 40, height: 40, display: "block", objectFit: "contain" }} />} 
        title="Statistiche"           
        description="Analizza l'andamento giornaliero degli ultimi 30 giorni."   
        path="/admin/stats"     
        color="#7f7800" />
      </div>
    </Layout>
  );
}
