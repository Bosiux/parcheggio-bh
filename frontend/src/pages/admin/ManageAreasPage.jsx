import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { getAllAreas, updateArea } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";

const toInt = (value) => Number.parseInt(String(value ?? "").trim(), 10);
const normalizeId = (value) => String(value ?? "").trim().toUpperCase();
const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

export default function ManageAreasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingArea, setEditingArea] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", capacity: "", availableSpots: "" });

  const loadAreas = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllAreas();
      setAreas(data);
    } catch (err) {
      setError(err.message || "Errore nel caricamento delle aree.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const filteredAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((area) => {
      const idMatch = String(area.id ?? "").toLowerCase().includes(q);
      const nameMatch = String(area.name ?? "").toLowerCase().includes(q);
      return idMatch || nameMatch;
    });
  }, [areas, query]);

  const openEditModal = (area) => {
    setEditingArea(area);
    setForm({
      id: String(area.id ?? ""),
      name: String(area.name ?? ""),
      capacity: String(area.capacity ?? ""),
      availableSpots: String(area.availableSpots ?? ""),
    });
    setError("");
    onOpen();
  };

  const validateForm = () => {
    const id = normalizeId(form.id);
    const name = String(form.name ?? "").trim();
    const capacity = toInt(form.capacity);
    const availableSpots = toInt(form.availableSpots);

    if (!id) return "L'ID area è obbligatorio.";
    if (!/^[A-Z0-9-]{2,20}$/.test(id)) {
      return "ID non valido: usa solo lettere, numeri o trattino (2-20 caratteri).";
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      return "La capienza deve essere un numero intero >= 1.";
    }
    if (!Number.isInteger(availableSpots) || availableSpots < 0) {
      return "I posti disponibili devono essere un numero intero >= 0.";
    }
    if (availableSpots > capacity) {
      return "I posti disponibili non possono superare la capienza.";
    }

    const occupiedBefore = Math.max(
      0,
      Number(editingArea?.capacity ?? 0) - Number(editingArea?.availableSpots ?? 0)
    );
    if (capacity < occupiedBefore) {
      return `Capienza troppo bassa: attualmente ci sono ${occupiedBefore} posti occupati.`;
    }

    const duplicateId = areas.some(
      (area) => normalizeId(area.id) === id && normalizeId(area.id) !== normalizeId(editingArea?.id)
    );
    if (duplicateId) return `ID area già esistente: ${id}.`;

    if (name) {
      const duplicateName = areas.some(
        (area) =>
          normalizeName(area.name) === normalizeName(name) &&
          normalizeId(area.id) !== normalizeId(editingArea?.id)
      );
      if (duplicateName) return "Nome area già esistente.";
    }

    return null;
  };

  const handleSave = async (onClose) => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        id: normalizeId(form.id),
        name: String(form.name ?? "").trim() || undefined,
        capacity: toInt(form.capacity),
        availableSpots: toInt(form.availableSpots),
      };
      const updated = await updateArea(editingArea.id, payload);

      setAreas((prev) =>
        prev.map((area) =>
          normalizeId(area.id) === normalizeId(editingArea.id) ? updated : area
        )
      );

      onClose();
      setEditingArea(null);
    } catch (err) {
      setError(err.message || "Errore durante il salvataggio dell'area.");
    } finally {
      setSaving(false);
    }
  };

  const totalCapacity = areas.reduce((sum, area) => sum + Number(area.capacity || 0), 0);
  const totalAvailable = areas.reduce((sum, area) => sum + Number(area.availableSpots || 0), 0);

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Gestisci Aree
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Visualizza e modifica le aree parcheggio con controlli su ID, capienza e disponibilita.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <Card style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)" }}>
          <CardBody style={{ padding: "1rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>Aree totali</p>
            <p style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>{areas.length}</p>
          </CardBody>
        </Card>
        <Card style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)" }}>
          <CardBody style={{ padding: "1rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>Capienza totale</p>
            <p style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>{totalCapacity}</p>
          </CardBody>
        </Card>
        <Card style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)" }}>
          <CardBody style={{ padding: "1rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>Posti disponibili</p>
            <p style={{ color: "#22c55e", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>{totalAvailable}</p>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Input
          placeholder="Cerca per ID o nome area..."
          value={query}
          onValueChange={setQuery}
          variant="bordered"
          classNames={{
            base: "max-w-md",
            inputWrapper: "!bg-[var(--surface-04)] !border-[var(--border-default)] data-[hover=true]:!border-[#bdb23c]/60 data-[focus=true]:!border-[#bdb23c]",
            input: "!text-[var(--text-primary)] placeholder:!text-[var(--text-muted)]",
          }}
        />

        <Button
          variant="flat"
          onPress={loadAreas}
          style={{
            color: "var(--text-secondary)",
            background: "var(--surface-04)",
            border: "1px solid var(--border-default)",
            fontWeight: 600,
          }}
        >
          Aggiorna lista
        </Button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            color: "#fca5a5",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="primary" label="Caricamento aree..." />
        </div>
      ) : filteredAreas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-subtle)" }}>
          Nessuna area trovata.
        </div>
      ) : (
        <>
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filteredAreas.map((area) => {
              const occupied = Math.max(0, Number(area.capacity || 0) - Number(area.availableSpots || 0));
              const pct = Number(area.capacity) > 0 ? Math.round((occupied / Number(area.capacity)) * 100) : 0;
              return (
                <Card key={area.id} style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)" }}>
                  <CardBody style={{ padding: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <div style={{ color: "#bdb23c", fontWeight: 800, fontSize: "0.9rem" }}>{area.id}</div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                          {area.name || `Parcheggio ${area.id}`}
                        </div>
                      </div>
                      <Chip size="sm" variant="flat" color={pct >= 80 ? "danger" : pct >= 50 ? "warning" : "success"}>
                        {pct}%
                      </Chip>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                        <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Capienza</div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{area.capacity}</div>
                      </div>
                      <div style={{ background: "var(--surface-02)", borderRadius: 10, padding: "0.55rem" }}>
                        <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>Disponibili</div>
                        <div style={{ color: "#22c55e", fontWeight: 700 }}>{area.availableSpots}</div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      fullWidth
                      variant="flat"
                      onPress={() => openEditModal(area)}
                      style={{
                        color: "#bdb23c",
                        background: "rgba(189,178,60,0.14)",
                        border: "1px solid rgba(189,178,60,0.3)",
                        fontWeight: 700,
                      }}
                    >
                      Modifica
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          <div
            className="hidden md:block"
            style={{
              background: "var(--surface-02)",
              border: "1px solid var(--border-soft)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <Table
              aria-label="Tabella gestione aree"
              removeWrapper
              classNames={{
                th: "bg-transparent text-default-500 border-b border-white/5 text-xs uppercase tracking-wider",
                td: "border-b border-white/5 text-default-300 py-3",
                tr: "hover:bg-white/[0.02] transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Nome</TableColumn>
                <TableColumn>Capienza</TableColumn>
                <TableColumn>Disponibili</TableColumn>
                <TableColumn>Occupazione</TableColumn>
                <TableColumn>Azioni</TableColumn>
              </TableHeader>
              <TableBody items={filteredAreas}>
                {(area) => {
                  const occupied = Math.max(0, Number(area.capacity || 0) - Number(area.availableSpots || 0));
                  const pct = Number(area.capacity) > 0 ? Math.round((occupied / Number(area.capacity)) * 100) : 0;
                  return (
                    <TableRow key={area.id}>
                      <TableCell>
                        <span style={{ color: "#bdb23c", fontWeight: 700 }}>{area.id}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                          {area.name || `Parcheggio ${area.id}`}
                        </span>
                      </TableCell>
                      <TableCell>{area.capacity}</TableCell>
                      <TableCell>{area.availableSpots}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={pct >= 80 ? "danger" : pct >= 50 ? "warning" : "success"}
                        >
                          {pct}%
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => openEditModal(area)}
                          style={{
                            color: "#bdb23c",
                            background: "rgba(189,178,60,0.14)",
                            border: "1px solid rgba(189,178,60,0.3)",
                            fontWeight: 700,
                          }}
                        >
                          Modifica
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/60",
        }}
        style={{ background: "var(--panel-bg)", border: "1px solid var(--border-default)" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                Modifica area {editingArea?.id}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="ID Area"
                  labelPlacement="outside"
                  value={form.id}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, id: val }))}
                  variant="bordered"
                />
                <Input
                  label="Nome area"
                  labelPlacement="outside"
                  value={form.name}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, name: val }))}
                  variant="bordered"
                />
                <Input
                  label="Capienza"
                  labelPlacement="outside"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, capacity: val }))}
                  variant="bordered"
                />
                <Input
                  label="Posti disponibili"
                  labelPlacement="outside"
                  type="number"
                  min="0"
                  value={form.availableSpots}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, availableSpots: val }))}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} style={{ color: "var(--text-muted)" }}>
                  Annulla
                </Button>
                <Button
                  isLoading={saving}
                  onPress={() => handleSave(onClose)}
                  style={{
                    background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  Salva modifiche
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Layout>
  );
}
