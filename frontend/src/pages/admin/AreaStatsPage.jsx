// src/pages/admin/AreaStatsPage.jsx
import { useState, useEffect } from "react";
import { Card, CardBody, Spinner, Select, SelectItem } from "@heroui/react";
import { getDailyStats, getAllAreas, getAllBookings } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
import TimeSeriesLineChart from "../../components/charts/TimeSeriesLineChart.jsx";
import RevenueByAreaBarChart from "../../components/charts/RevenueByAreaBarChart.jsx";

export default function AreaStatsPage() {
  const [areas, setAreas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [revenueRange, setRevenueRange] = useState("1d");
  const [stats, setStats] = useState([]);
  const [revenueByArea, setRevenueByArea] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carica le aree al mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const [areasData, bookingsData] = await Promise.all([getAllAreas(), getAllBookings()]);
        setAreas(areasData);
        setBookings(bookingsData);
      } catch (err) {
        console.error("Errore nel caricamento delle aree per le statistiche", err);
      }
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    if (areas.length === 0) {
      setRevenueByArea([]);
      setTotalRevenue(0);
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const periodDays = revenueRange === "30d" ? 30 : revenueRange === "7d" ? 7 : 1;
    const rangeStart = new Date(startOfToday);
    rangeStart.setDate(rangeStart.getDate() - (periodDays - 1));
    const rangeEnd = now;

    const computeRevenueInRange = (booking, fallbackHourlyRate) => {
      if (booking?.status === "cancelled") return 0;

      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;

      const overlapStart = new Date(Math.max(start.getTime(), rangeStart.getTime()));
      const overlapEnd = new Date(Math.min(end.getTime(), rangeEnd.getTime()));
      if (overlapEnd <= overlapStart) return 0;

      const overlapHours = (overlapEnd.getTime() - overlapStart.getTime()) / 3600000;
      const effectiveRate = Number(booking.hourlyRate ?? fallbackHourlyRate ?? 0);
      return overlapHours * effectiveRate;
    };

    const revenueRows = areas.map((area) => {
      const isUnderMaintenance = Boolean(area.isUnderMaintenance);
      const hourlyRate = Number(area.hourlyRate ?? 0);

      const revenue = isUnderMaintenance
        ? 0
        : bookings
            .filter((booking) => booking.areaId === area.id)
            .reduce((sum, booking) => sum + computeRevenueInRange(booking, hourlyRate), 0);

      return {
        id: area.id,
        name: area.name || `Area ${area.id}`,
        value: Number(revenue.toFixed(2)),
      };
    });

    setRevenueByArea(revenueRows);
    setTotalRevenue(Number(revenueRows.reduce((sum, row) => sum + Number(row.value || 0), 0).toFixed(2)));
  }, [areas, bookings, revenueRange]);

  // Carica le statistiche in base all'area selezionata
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDailyStats(selectedArea || null);
        setStats(data);
      } catch (err) {
        setError(err.message || "Errore nel caricamento delle statistiche.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedArea]);

  const chartData = stats.map((stat) => {
    return {
      date: stat.date,
      value: Number(stat.count ?? 0),
    };
  });

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Statistiche Prenotazioni
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Andamento giornaliero delle prenotazioni degli ultimi 30 giorni.
        </p>
      </div>

      <div style={{ marginBottom: "2rem", maxWidth: 300 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          Seleziona area
        </p>
        <Select
          aria-label="Seleziona area"
          placeholder="Tutte le aree"
          selectedKeys={selectedArea ? [selectedArea] : []}
          renderValue={(items) => {
            const item = items[0];

            if (!item) {
              return <span style={{ color: "var(--text-muted)" }}>Tutte le aree</span>;
            }

            const resolvedLabel = areas.find((area) => String(area.id) === String(item.key))?.name || `Area ${item.key}`;

            return <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{resolvedLabel}</span>;
          }}
          onSelectionChange={(keys) => {
            const arr = Array.from(keys);
            setSelectedArea(arr[0] || "");
          }}
          classNames={{
            trigger: "min-h-12 py-2 bg-[var(--surface-04)] border border-[var(--border-default)] data-[hover=true]:border-[#bdb23c]/60 data-[focus=true]:border-[#bdb23c]",
            selectorIcon: "text-[var(--text-muted)]",
            listboxWrapper: "bg-[var(--panel-bg)]",
            popoverContent: "bg-[var(--panel-bg)] border border-[var(--border-default)]",
            listbox: "bg-[var(--panel-bg)] text-[var(--text-primary)]",
          }}
        >
          <SelectItem key="" value="" textValue="Tutte le aree" className="text-[var(--text-primary)] data-[hover=true]:bg-[var(--surface-05)] data-[selectable=true]:focus:bg-[var(--surface-05)]">
            Tutte le aree
          </SelectItem>
          {areas.map((area) => (
            <SelectItem key={area.id} value={area.id} textValue={area.name || `Area ${area.id}`} className="text-[var(--text-primary)] data-[hover=true]:bg-[var(--surface-05)] data-[selectable=true]:focus:bg-[var(--surface-05)]">
              {area.name || `Area ${area.id}`}
            </SelectItem>
          ))}
        </Select>
      </div>

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
          ⚠️ {error}
        </div>
      )}

      <Card
        style={{
          background: "var(--surface-02)",
          border: "1px solid var(--surface-05)",
        }}
      >
        <CardBody style={{ padding: "2rem", minHeight: 300 }}>
          {loading ? (
             <div style={{ display: "flex", justifyContent: "center", alignItems:"center", height: "100%" }}>
               <Spinner color="primary" label="Caricamento statistiche..." />
             </div>
          ) : stats.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems:"center", height: "100%", color: "var(--text-muted)" }}>
              Nessun dato disponibile per il periodo.
            </div>
          ) : (
            <div>
              <h3 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
                Andamento ultimi 30 giorni
              </h3>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <TimeSeriesLineChart
                  width={700}
                  height={380}
                  data={chartData}
                  valueKey="value"
                  dateKey="date"
                />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "0.5rem" }}>
                Asse X: giorni (gg/mm) · Asse Y: numero di prenotazioni giornaliere
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: "1.5rem", marginBottom: "0.75rem", maxWidth: 300 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          Periodo ricavi
        </p>
        <Select
          aria-label="Seleziona periodo ricavi"
          selectedKeys={[revenueRange]}
          onSelectionChange={(keys) => {
            const arr = Array.from(keys);
            setRevenueRange(String(arr[0] || "1d"));
          }}
          classNames={{
            trigger: "min-h-12 py-2 bg-[var(--surface-04)] border border-[var(--border-default)] data-[hover=true]:border-[#bdb23c]/60 data-[focus=true]:border-[#bdb23c]",
            selectorIcon: "text-[var(--text-muted)]",
            listboxWrapper: "bg-[var(--panel-bg)]",
            popoverContent: "bg-[var(--panel-bg)] border border-[var(--border-default)]",
            listbox: "bg-[var(--panel-bg)] text-[var(--text-primary)]",
          }}
        >
          <SelectItem key="1d" textValue="Oggi" className="text-[var(--text-primary)] data-[hover=true]:bg-[var(--surface-05)] data-[selectable=true]:focus:bg-[var(--surface-05)]">
            Oggi
          </SelectItem>
          <SelectItem key="7d" textValue="Ultimi 7 giorni" className="text-[var(--text-primary)] data-[hover=true]:bg-[var(--surface-05)] data-[selectable=true]:focus:bg-[var(--surface-05)]">
            Ultimi 7 giorni
          </SelectItem>
          <SelectItem key="30d" textValue="Ultimi 30 giorni" className="text-[var(--text-primary)] data-[hover=true]:bg-[var(--surface-05)] data-[selectable=true]:focus:bg-[var(--surface-05)]">
            Ultimi 30 giorni
          </SelectItem>
        </Select>
      </div>

      <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem", gridTemplateColumns: "minmax(240px, 320px) 1fr" }}>
        <Card
          style={{
            background: "var(--surface-04)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <CardBody style={{ padding: "1.2rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Ricavo totale periodo
            </p>
            <p style={{ color: "#bdb23c", fontSize: "2rem", fontWeight: 800, margin: "0.35rem 0 0" }}>
              € {totalRevenue.toFixed(2)}
            </p>
            <p style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginTop: "0.35rem" }}>
              {revenueRange === "1d"
                ? "Somma dei ricavi maturati oggi su tutte le aree."
                : revenueRange === "7d"
                ? "Somma dei ricavi maturati negli ultimi 7 giorni su tutte le aree."
                : "Somma dei ricavi maturati negli ultimi 30 giorni su tutte le aree."}
            </p>
          </CardBody>
        </Card>

        <Card
          style={{
            background: "var(--surface-02)",
            border: "1px solid var(--surface-05)",
          }}
        >
          <CardBody style={{ padding: "1.2rem" }}>
            {revenueByArea.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                Nessun dato ricavi disponibile.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <RevenueByAreaBarChart
                  width={780}
                  height={Math.max(280, revenueByArea.length * 62)}
                  data={revenueByArea}
                  valueKey="value"
                  nameKey="name"
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
    </Layout>
  );
}
