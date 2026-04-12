// src/pages/user/HistoryPage.jsx
import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Button,
} from "@heroui/react";
import { getMyBookings } from "../../api/parking.api.js";
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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
  });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filter, setFilter]       = useState("all");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (err) {
        setError(err.message || "Errore nel caricamento dello storico.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const columns = [
    { key: "id",        label: "ID" },
    { key: "area",      label: "Area" },
    { key: "date",      label: "Data" },
    { key: "start",     label: "Inizio" },
    { key: "end",       label: "Fine" },
    { key: "duration",  label: "Durata" },
    { key: "status",    label: "Stato" },
  ];

  const filterButtons = [
    { key: "all",       label: "Tutte" },
    { key: "active",    label: "Attive" },
    { key: "completed", label: "Completate" },
    { key: "expired",   label: "Scadute" },
  ];

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Storico Prenotazioni
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Visualizza tutte le tue prenotazioni passate e in corso.
        </p>
      </div>

      {/* Stats row */}
      {!loading && bookings.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            { label: "Totali",      value: bookings.length,                                             color: "#bdb23c" },
            { label: "Attive",      value: bookings.filter((b) => b.status === "active").length,        color: "#22c55e" },
            { label: "Completate",  value: bookings.filter((b) => b.status === "completed").length,     color: "#9b9b00" },
            { label: "Scadute",     value: bookings.filter((b) => b.status === "expired").length,       color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "var(--surface-04)",
                border: "1px solid var(--border-soft)",
                borderRadius: 12,
                padding: "1rem 1.25rem",
                textAlign: "center",
              }}
            >
              <div style={{ color, fontWeight: 800, fontSize: "1.75rem" }}>{value}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {filterButtons.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "solid" : "flat"}
            onPress={() => setFilter(key)}
            style={
              filter === key
                ? { background: "linear-gradient(135deg, #bdb23c, #9b9b00)", color: "white", fontWeight: 600 }
                : key === "active"
                ? { color: "#16a34a", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }
                : key === "completed"
                ? { color: "#7c3aed", background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.3)" }
                : key === "expired"
                ? { color: "#d97706", background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.3)" }
                : { color: "#bdb23c", background: "rgba(189,178,60,0.14)", border: "1px solid rgba(189,178,60,0.3)" }
            }
          >
            {label}
          </Button>
        ))}
      </div>

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
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="primary" label="Caricamento storico..." />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-subtle)" }}>
          <div style={{ fontSize: 64, marginBottom: "1rem" }}>📋</div>
          <h3 style={{ color: "var(--text-muted)" }}>Nessuna prenotazione</h3>
          <p>Non hai ancora effettuato prenotazioni.</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((booking) => (
              <div
                key={booking.id}
                style={{
                  background: "var(--surface-04)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "0.5rem" }}>
                  <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                    #{String(booking.id).slice(-6)}
                  </span>
                  <StatusChip status={booking.status} />
                </div>

                <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  {booking.areaName || booking.area?.name || `Area ${booking.areaId}`}
                </div>
                <div style={{ color: "var(--text-subtle)", fontSize: "0.78rem", marginBottom: "0.65rem" }}>
                  ID {booking.areaId} · Durata {booking.duration || "1h"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Inizio</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {formatDate(booking.startTime || booking.createdAt)} {formatTime(booking.startTime || booking.createdAt)}
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Fine</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {formatDate(booking.endTime)} {formatTime(booking.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="hidden md:block"
            style={{
              background: "var(--surface-04)",
              border: "1px solid var(--border-soft)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <Table
              aria-label="Storico prenotazioni personali"
              removeWrapper
              classNames={{
                th: "bg-transparent text-[var(--text-muted)] border-b border-[var(--border-soft)] text-xs uppercase tracking-wider",
                td: "border-b border-[var(--border-soft)] text-[var(--text-primary)] py-3",
                tr: "hover:bg-[var(--surface-02)] transition-colors",
              }}
            >
              <TableHeader columns={columns}>
                {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
              </TableHeader>
              <TableBody items={filtered}>
                {(booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        #{String(booking.id).slice(-6)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {booking.areaName || booking.area?.name || `Area ${booking.areaId}`}
                      </div>
                      <div style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>ID {booking.areaId}</div>
                    </TableCell>
                    <TableCell>{formatDate(booking.startTime || booking.createdAt)}</TableCell>
                    <TableCell>{formatTime(booking.startTime || booking.createdAt)}</TableCell>
                    <TableCell>{formatTime(booking.endTime)}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="secondary">
                        {booking.duration || "1h"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={booking.status} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* No results after filter */}
      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-subtle)" }}>
          Nessuna prenotazione con filtro "{filterButtons.find(f => f.key === filter)?.label}".
        </div>
      )}
    </Layout>
  );
}
