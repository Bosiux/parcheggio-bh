// src/pages/admin/AllBookingsPage.jsx
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
  Input,
} from "@heroui/react";
import { getAllBookings } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";
const iconAlarmStyle = {
  width: 35,
  height: 35,
  display: "block",
  objectFit: "contain",
};
// Utilità per formattare la data e l'ora
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Componente per lo stato della prenotazione
const StatusChip = ({ status }) => {
  const map = {
    active: { color: "success", label: "Attiva" },
    completed: { color: "default", label: "Completata" },
    cancelled: { color: "danger", label: "Annullata" },
    expired: { color: "warning", label: "Scaduta" },
  };
  const { color, label } = map[status] ?? { color: "default", label: status };
  return (
    <Chip size="sm" color={color} variant="flat">
      {label}
    </Chip>
  );
};

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getAllBookings();
        setBookings(data);
      } catch (err) {
        setError(err.message || "Errore nel caricamento delle prenotazioni.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filtraggio basato sul termine di ricerca
  const filteredBookings = bookings.filter((b) => {
    const searchLow = searchTerm.toLowerCase();
    const areaIdMatch = (b.areaId || "").toString().toLowerCase().includes(searchLow);
    const areaNameMatch = (b.area?.name || "").toLowerCase().includes(searchLow);
    const userIdMatch = (b.userId || "").toString().toLowerCase().includes(searchLow);
    const statusMatch = (b.status || "").toLowerCase().includes(searchLow);
    return areaIdMatch || areaNameMatch || userIdMatch || statusMatch;
  });

  const columns = [
    { key: "id", label: "ID PREN." },
    { key: "user", label: "UTENTE" },
    { key: "area", label: "AREA" },
    { key: "start", label: "INIZIO" },
    { key: "end", label: "FINE" },
    { key: "status", label: "STATO" },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Tutte le Prenotazioni
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Storico globale delle prenotazioni effettuate da tutti gli utenti.
        </p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <Input
          placeholder="Cerca per area, utente o stato..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          variant="bordered"
          className="max-w-md"
          classNames={{
            base: "max-w-md",
            inputWrapper: "!bg-[var(--surface-04)] !border-[var(--border-default)] data-[hover=true]:!border-[#bdb23c]/60 data-[focus=true]:!border-[#bdb23c]",
            input: "!text-[var(--text-primary)] placeholder:!text-[var(--text-muted)]",
          }}
          startContent={<span style={{ color: "var(--text-muted)" }}>{<img src="/search.svg" alt="Cerca" style={{ width: 25, height: 25, display: "block", objectFit: "contain" }} />}</span>}
        />
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
          <img src="/attention.svg" alt="Errore" style={iconAlarmStyle} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="primary" label="Caricamento prenotazioni..." />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-subtle)" }}>
          <div style={{ fontSize: 64, marginBottom: "1rem" }}>{<img src="/addGeo.svg" alt="Aree" style={{ width: 44, height: 44, display: "block", objectFit: "contain" }} />}</div>
          <h3 style={{ color: "var(--text-muted)" }}>Nessuna prenotazione trovata</h3>
          <p>
            {searchTerm
              ? "Nessun risultato corrisponde alla ricerca."
              : "Non sono presenti prenotazioni nel sistema."}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filteredBookings.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "var(--surface-04)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "0.9rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                    #{String(item.id).slice(-6)}
                  </span>
                  <StatusChip status={item.status} />
                </div>

                <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.25rem" }}>
                  {item.area?.name || `Area ${item.areaId}`}
                </div>
                <div style={{ color: "var(--text-subtle)", fontSize: "0.8rem", marginBottom: "0.65rem" }}>
                  Utente: {item.user?.username || `Utente ${item.userId}`}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Inizio</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {formatDate(item.startTime)} {formatTime(item.startTime)}
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Fine</div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {formatDate(item.endTime)} {formatTime(item.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="hidden md:block"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-soft)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <Table
              aria-label="Tabella globale prenotazioni"
              removeWrapper
              classNames={{
                th: "bg-transparent text-default-500 border-b border-white/5 text-xs uppercase tracking-wider",
                td: "border-b border-white/5 text-default-300 py-3",
                tr: "hover:bg-white/[0.02] transition-colors",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
              </TableHeader>
              <TableBody items={filteredBookings}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span style={{ color: "#bdb23c", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        #{String(item.id).slice(-6)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.user?.username || `Utente ${item.userId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.area?.name || `Area ${item.areaId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(item.startTime)} {formatTime(item.startTime)}
                    </TableCell>
                    <TableCell>
                      {formatDate(item.endTime)} {formatTime(item.endTime)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status} />
                    </TableCell>
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
