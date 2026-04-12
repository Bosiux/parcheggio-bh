// src/pages/admin/AreaStatsPage.jsx
import { useState, useEffect } from "react";
import { Card, CardBody, Spinner, Select, SelectItem } from "@heroui/react";
import { getDailyStats, getAllAreas } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
import TimeSeriesLineChart from "../../components/charts/TimeSeriesLineChart.jsx";

export default function AreaStatsPage() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carica le aree al mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const data = await getAllAreas();
        setAreas(data);
      } catch (err) {
        console.error("Errore nel caricamento delle aree per le statistiche", err);
      }
    };
    fetchAreas();
  }, []);

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
      
    </Layout>
  );
}
