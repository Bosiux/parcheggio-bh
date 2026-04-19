// src/pages/user/HistoryPage.jsx
import { useState, useEffect } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner, Button,
} from "@heroui/react";
import { getMyBookings, cancelBooking } from "../../api/parking.api.js";
import Layout from "../../components/Layout.jsx";

function StatusChip({ status }) {
  const map = {
    active:    { color: "success",   label: "Attiva" },
    completed: { color: "secondary", label: "Completata" },
    cancelled: { color: "danger",    label: "Annullata" },
    expired:   { color: "warning",   label: "Scaduta" },
  };
  const { color, label } = map[status] ?? { color: "default", label: status };
  return <Chip size="sm" color={color} variant="flat">{label}</Chip>;
}

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—";
const computeTotal = (b) => {
  if (Number.isFinite(Number(b.totalPrice))) return Number(b.totalPrice);
  return Number(((Number(b.durationHours ?? 1) || 1) * Number(b.hourlyRate ?? 0)).toFixed(2));
};

const filterButtons = [
  { key: "all",       label: "Tutte" },
  { key: "active",    label: "Attive" },
  { key: "completed", label: "Completate" },
  { key: "expired",   label: "Scadute" },
  { key: "cancelled", label: "Annullate" },
];

const columns = [
  { key: "id",       label: "ID" },
  { key: "area",     label: "Area" },
  { key: "date",     label: "Data" },
  { key: "start",    label: "Inizio" },
  { key: "end",      label: "Fine" },
  { key: "duration", label: "Durata" },
  { key: "total",    label: "Totale" },
  { key: "status",   label: "Stato" },
  { key: "actions",  label: "Azioni" },
];

export default function HistoryPage() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState("all");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try { setBookings(await getMyBookings()); }
      catch (err) { setError(err.message || "Errore nel caricamento dello storico."); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
    } catch (err) {
      setError(err.message || "Errore durante la cancellazione.");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const filterStyle = (key) => {
    if (filter === key) return { background: "linear-gradient(135deg,#bdb23c,#9b9b00)", color: "white", fontWeight: 600, border: "none" };
    const m = {
      active:    { color: "#16a34a", background: "rgba(34,197,94,0.12)",   border: "1px solid rgba(34,197,94,0.25)" },
      completed: { color: "#7c3aed", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" },
      expired:   { color: "#d97706", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" },
      cancelled: { color: "#ef4444", background: "rgba(239,68,68,0.10)",  border: "1px solid rgba(239,68,68,0.25)" },
      all:       { color: "#bdb23c", background: "rgba(189,178,60,0.12)", border: "1px solid rgba(189,178,60,0.25)" },
    };
    return m[key];
  };

  const cardRowStyle = {
    background: "var(--surface-04)",
    border: "1px solid var(--border-default)",
    borderRadius: 12,
    padding: "0.9rem",
  };

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Storico Prenotazioni</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Visualizza tutte le tue prenotazioni passate e in corso.</p>
      </div>

      {/* Stat mini cards */}
      {!loading && bookings.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Totali",     value: bookings.length,                                          color: "#bdb23c" },
            { label: "Attive",     value: bookings.filter((b) => b.status === "active").length,     color: "#22c55e" },
            { label: "Completate", value: bookings.filter((b) => b.status === "completed").length,  color: "#9b9b00" },
            { label: "Scadute",    value: bookings.filter((b) => b.status === "expired").length,    color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--surface-04)", border: "1px solid var(--border-default)", borderRadius: 12, padding: "1rem 1.25rem", textAlign: "center" }}>
              <div style={{ color, fontWeight: 800, fontSize: "1.75rem" }}>{value}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {filterButtons.map(({ key, label }) => (
          <Button key={key} size="sm" variant="flat" onPress={() => setFilter(key)} style={filterStyle(key)}>
            {label}
          </Button>
        ))}
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1.5rem" }}>⚠️ {error}</div>}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="warning" label="Caricamento storico..." />
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-subtle)" }}>
          <div style={{ fontSize: 64, marginBottom: "1rem" }}>📋</div>
          <h3 style={{ color: "var(--text-muted)" }}>Nessuna prenotazione</h3>
          <p>Non hai ancora effettuato prenotazioni.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Mobile */}
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((b) => (
              <div key={b.id} style={cardRowStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "0.5rem" }}>
                  <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>#{String(b.id).slice(-6)}</span>
                  <StatusChip status={b.status} />
                </div>
                <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{b.areaName || b.area?.name || `Area ${b.areaId}`}</div>
                <div style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginBottom: "0.65rem" }}>
                  ID {b.areaId} · {`${b.durationHours ?? 1}h`} · € {computeTotal(b).toFixed(2)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: b.status === "active" ? "0.75rem" : 0 }}>
                  {[
                    { label: "Inizio", time: b.startTime || b.createdAt },
                    { label: "Fine",   time: b.endTime },
                  ].map(({ label, time }) => (
                    <div key={label} style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                      <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>{label}</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>{fmtDate(time)} {fmtTime(time)}</div>
                    </div>
                  ))}
                </div>
                {b.status === "active" && (
                  <Button size="sm" fullWidth variant="flat" isLoading={cancelling === b.id} onPress={() => handleCancel(b.id)}
                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", fontWeight: 600 }}>
                    Annulla prenotazione
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block" style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
            <Table
              aria-label="Storico prenotazioni"
              removeWrapper
              classNames={{
                th: "bg-transparent text-slate-500 border-b border-black/5 dark:border-white/[0.07] text-xs uppercase tracking-wider",
                td: "border-b border-black/5 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 py-3",
                tr: "hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors",
              }}
            >
              <TableHeader columns={columns}>
                {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
              </TableHeader>
              <TableBody items={filtered}>
                {(b) => (
                  <TableRow key={b.id}>
                    <TableCell><span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem" }}>#{String(b.id).slice(-6)}</span></TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{b.areaName || b.area?.name || `Area ${b.areaId}`}</div>
                      <div style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>ID {b.areaId}</div>
                    </TableCell>
                    <TableCell>{fmtDate(b.startTime || b.createdAt)}</TableCell>
                    <TableCell>{fmtTime(b.startTime || b.createdAt)}</TableCell>
                    <TableCell>{fmtTime(b.endTime)}</TableCell>
                    <TableCell><Chip size="sm" variant="flat" color="secondary">{`${b.durationHours ?? 1}h`}</Chip></TableCell>
                    <TableCell><span style={{ color: "#bdb23c", fontWeight: 700 }}>€ {computeTotal(b).toFixed(2)}</span></TableCell>
                    <TableCell><StatusChip status={b.status} /></TableCell>
                    <TableCell>
                      {b.status === "active" && (
                        <Button size="sm" variant="flat" isLoading={cancelling === b.id} onPress={() => handleCancel(b.id)}
                          style={{ color: "#ef4444", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)", fontWeight: 600 }}>
                          Annulla
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-subtle)" }}>
          Nessuna prenotazione con filtro "{filterButtons.find((f) => f.key === filter)?.label}".
        </div>
      )}
    </Layout>
  );
}
