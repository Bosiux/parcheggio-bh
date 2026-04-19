// src/pages/admin/AreaStatsPage.jsx
import { useState, useEffect } from "react";
import { Card, CardBody, Spinner, Select, SelectItem } from "@heroui/react";
import { getDailyStats, getAllAreas, getRevenueStats } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
import TimeSeriesLineChart from "../../components/charts/TimeSeriesLineChart.jsx";
import RevenueByAreaBarChart from "../../components/charts/RevenueByAreaBarChart.jsx";

const CARD_BASE = "bg-white/80 dark:!bg-white/[0.04] border border-black/5 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl";

const selectCls = {
  trigger: "min-h-12 py-2 bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 data-[hover=true]:!border-yellow-500/60 data-[focus=true]:!border-yellow-500",
  selectorIcon: "text-slate-500",
  listboxWrapper: "bg-white dark:bg-[#111827]",
  popoverContent: "bg-white dark:bg-[#111827] border border-black/10 dark:border-white/10",
  listbox: "bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200",
};
const itemCls = "text-slate-800 dark:text-slate-200 data-[hover=true]:!bg-black/5 dark:data-[hover=true]:!bg-white/[0.05] data-[selectable=true]:focus:!bg-black/5 dark:data-[selectable=true]:focus:!bg-white/[0.05]";

export default function AreaStatsPage() {
  const [areas, setAreas]               = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [revenueRange, setRevenueRange] = useState("1d");
  const [stats, setStats]               = useState([]);
  const [revenueByArea, setRevenueByArea] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => { getAllAreas().then(setAreas).catch(console.error); }, []);

  useEffect(() => {
    getRevenueStats(revenueRange)
      .then((data) => {
        const rows = data.map((r) => ({ id: r.id, name: r.name || `Area ${r.id}`, value: Number(r.revenue ?? 0) }));
        setRevenueByArea(rows);
        setTotalRevenue(Number(rows.reduce((s, r) => s + r.value, 0).toFixed(2)));
      })
      .catch(() => { setRevenueByArea([]); setTotalRevenue(0); });
  }, [revenueRange]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError("");
      try { setStats(await getDailyStats(selectedArea || null)); }
      catch (err) { setError(err.message || "Errore nel caricamento delle statistiche."); }
      finally { setLoading(false); }
    };
    fetch();
  }, [selectedArea]);

  const chartData = stats.map((s) => ({ date: s.date, value: Number(s.count ?? 0) }));

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Statistiche Prenotazioni</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Andamento giornaliero delle prenotazioni degli ultimi 30 giorni.</p>
      </div>

      {/* Area selector */}
      <div style={{ marginBottom: "2rem", maxWidth: 300 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Seleziona area</p>
        <Select
          aria-label="Seleziona area"
          placeholder="Tutte le aree"
          selectedKeys={selectedArea ? [selectedArea] : []}
          renderValue={(items) => {
            const item = items[0];
            if (!item) return <span style={{ color: "var(--text-muted)" }}>Tutte le aree</span>;
            const label = areas.find((a) => String(a.id) === String(item.key))?.name || `Area ${item.key}`;
            return <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{label}</span>;
          }}
          onSelectionChange={(keys) => setSelectedArea(Array.from(keys)[0] || "")}
          classNames={selectCls}
        >
          <SelectItem key="" textValue="Tutte le aree" className={itemCls}>Tutte le aree</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a.id} textValue={a.name || `Area ${a.id}`} className={itemCls}>
              {a.name || `Area ${a.id}`}
            </SelectItem>
          ))}
        </Select>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>⚠️ {error}</div>}

      {/* Line chart */}
      <Card shadow="none" classNames={{ base: `${CARD_BASE} mb-6` }}>
        <CardBody style={{ padding: "2rem", minHeight: 300 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: "3rem" }}>
              <Spinner color="warning" label="Caricamento statistiche..." />
            </div>
          ) : stats.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", padding: "3rem" }}>
              Nessun dato disponibile per il periodo.
            </div>
          ) : (
            <div>
              <h3 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem" }}>Andamento ultimi 30 giorni</h3>
              <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
                <TimeSeriesLineChart width={700} height={380} data={chartData} valueKey="value" dateKey="date" />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "0.5rem" }}>
                Asse X: giorni (gg/mm) · Asse Y: numero di prenotazioni giornaliere
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Revenue selector */}
      <div style={{ marginBottom: "1.5rem", maxWidth: 300 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Periodo ricavi</p>
        <Select
          aria-label="Seleziona periodo ricavi"
          selectedKeys={[revenueRange]}
          onSelectionChange={(keys) => setRevenueRange(String(Array.from(keys)[0] || "1d"))}
          classNames={selectCls}
        >
          <SelectItem key="1d"  textValue="Oggi"             className={itemCls}>Oggi</SelectItem>
          <SelectItem key="7d"  textValue="Ultimi 7 giorni"  className={itemCls}>Ultimi 7 giorni</SelectItem>
          <SelectItem key="30d" textValue="Ultimi 30 giorni" className={itemCls}>Ultimi 30 giorni</SelectItem>
        </Select>
      </div>

      {/* Revenue row */}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(240px, 320px) 1fr" }}>
        <Card shadow="none" classNames={{ base: CARD_BASE }}>
          <CardBody style={{ padding: "1.25rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Ricavo totale periodo
            </p>
            <p style={{ color: "#bdb23c", fontSize: "2rem", fontWeight: 800, margin: "0.35rem 0 0" }}>
              € {totalRevenue.toFixed(2)}
            </p>
            <p style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginTop: "0.35rem" }}>
              {revenueRange === "1d" ? "Somma dei ricavi maturati oggi su tutte le aree."
               : revenueRange === "7d" ? "Somma degli ultimi 7 giorni su tutte le aree."
               : "Somma degli ultimi 30 giorni su tutte le aree."}
            </p>
          </CardBody>
        </Card>

        <Card shadow="none" classNames={{ base: CARD_BASE }}>
          <CardBody style={{ padding: "1.25rem" }}>
            {revenueByArea.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>Nessun dato ricavi disponibile.</div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
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
