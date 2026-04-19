// src/pages/admin/AllBookingsPage.jsx
import { useState, useEffect } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner, Input,
} from "@heroui/react";
import { getAllBookings } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—";

const StatusChip = ({ status }) => {
  const map = {
    active:    { color: "success", label: "Attiva" },
    completed: { color: "default", label: "Completata" },
    cancelled: { color: "danger",  label: "Annullata" },
    expired:   { color: "warning", label: "Scaduta" },
  };
  const { color, label } = map[status] ?? { color: "default", label: status };
  return <Chip size="sm" color={color} variant="flat">{label}</Chip>;
};

const columns = [
  { key: "id",     label: "ID PREN." },
  { key: "user",   label: "UTENTE" },
  { key: "area",   label: "AREA" },
  { key: "start",  label: "INIZIO" },
  { key: "end",    label: "FINE" },
  { key: "status", label: "STATO" },
];

export default function AllBookingsPage() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try { setBookings(await getAllBookings()); }
      catch (err) { setError(err.message || "Errore nel caricamento delle prenotazioni."); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = bookings.filter((b) => {
    const s = searchTerm.toLowerCase();
    return (b.areaId || "").toString().toLowerCase().includes(s)
        || (b.area?.name || "").toLowerCase().includes(s)
        || (b.userId || "").toString().toLowerCase().includes(s)
        || (b.status || "").toLowerCase().includes(s);
  });

  const cardRow = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.9rem" };

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>Tutte le Prenotazioni</h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Storico globale delle prenotazioni effettuate da tutti gli utenti.</p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <Input
          placeholder="Cerca per area, utente o stato..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          variant="bordered"
          classNames={{
            base: "max-w-md",
            inputWrapper: "border-white/10 bg-white/[0.05] hover:!border-yellow-500/50 focus-within:!border-yellow-500",
            input: "!text-slate-100 placeholder:!text-slate-500",
          }}
          startContent={<img src="/search.svg" alt="Cerca" style={{ width: 22, height: 22, objectFit: "contain" }} />}
        />
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
          <img src="/attention.svg" alt="Errore" style={{ width: 28, height: 28, objectFit: "contain" }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="warning" label="Caricamento prenotazioni..." />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#475569" }}>
          <img src="/addGeo.svg" alt="Nessuna" style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 1rem" }} />
          <h3 style={{ color: "#64748b" }}>Nessuna prenotazione trovata</h3>
          <p>{searchTerm ? "Nessun risultato corrisponde alla ricerca." : "Non sono presenti prenotazioni nel sistema."}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((item) => (
              <div key={item.id} style={cardRow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>#{String(item.id).slice(-6)}</span>
                  <StatusChip status={item.status} />
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "0.25rem" }}>{item.area?.name || `Area ${item.areaId}`}</div>
                <div style={{ color: "#475569", fontSize: "0.8rem", marginBottom: "0.65rem" }}>Utente: {item.user?.username || `Utente ${item.userId}`}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {[
                    { label: "Inizio", t: item.startTime },
                    { label: "Fine",   t: item.endTime },
                  ].map(({ label, t }) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "0.55rem" }}>
                      <div style={{ color: "#475569", fontSize: "0.7rem" }}>{label}</div>
                      <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.85rem" }}>{fmtDate(t)} {fmtTime(t)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
            <Table
              aria-label="Tabella globale prenotazioni"
              removeWrapper
              classNames={{
                th: "bg-transparent text-slate-500 border-b border-white/[0.07] text-xs uppercase tracking-wider",
                td: "border-b border-white/[0.07] text-slate-200 py-3",
                tr: "hover:bg-white/[0.02] transition-colors",
              }}
            >
              <TableHeader columns={columns}>
                {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
              </TableHeader>
              <TableBody items={filtered}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell><span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem" }}>#{String(item.id).slice(-6)}</span></TableCell>
                    <TableCell><span style={{ fontWeight: 600 }}>{item.user?.username || `Utente ${item.userId}`}</span></TableCell>
                    <TableCell><span style={{ fontWeight: 600 }}>{item.area?.name || `Area ${item.areaId}`}</span></TableCell>
                    <TableCell>{fmtDate(item.startTime)} {fmtTime(item.startTime)}</TableCell>
                    <TableCell>{fmtDate(item.endTime)} {fmtTime(item.endTime)}</TableCell>
                    <TableCell><StatusChip status={item.status} /></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </Layout>
  );
}
