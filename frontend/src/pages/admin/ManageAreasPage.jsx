// src/pages/admin/ManageAreasPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Card, CardBody, Input, Button, Chip, Switch, Spinner,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import { getAllAreas, updateArea } from "../../api/admin.api.js";
import Layout from "../../components/Layout.jsx";

const CARD_BASE = "bg-white/80 dark:!bg-white/[0.04] border border-black/5 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl";
const toInt       = (v) => Number.parseInt(String(v ?? "").trim(), 10);
const normalizeId = (v) => String(v ?? "").trim().toUpperCase();
const normalizeName = (v) => String(v ?? "").trim().toLowerCase();

const inputCls = {
  inputWrapper: "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:!border-yellow-500/50 focus-within:!border-yellow-500",
  input: "!text-slate-900 dark:!text-slate-100 placeholder:!text-slate-500",
  label: "!text-slate-700 dark:!text-slate-400",
};

export default function ManageAreasPage() {
  const [areas, setAreas]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [query, setQuery]     = useState("");
  const [saving, setSaving]   = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingArea, setEditingArea]   = useState(null);
  const [form, setForm] = useState({ id: "", name: "", capacity: "", hourlyRate: "", isUnderMaintenance: false });

  const loadAreas = async () => {
    setLoading(true); setError("");
    try { setAreas(await getAllAreas()); }
    catch (err) { setError(err.message || "Errore nel caricamento delle aree."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAreas(); }, []);

  const filteredAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) =>
      String(a.id ?? "").toLowerCase().includes(q) || String(a.name ?? "").toLowerCase().includes(q)
    );
  }, [areas, query]);

  const openEditModal = (area) => {
    setEditingArea(area);
    setForm({ id: String(area.id ?? ""), name: String(area.name ?? ""), capacity: String(area.capacity ?? ""), hourlyRate: String(area.hourlyRate ?? "0"), isUnderMaintenance: Boolean(area.isUnderMaintenance) });
    setError(""); onOpen();
  };

  const validateForm = () => {
    const id = normalizeId(form.id);
    const capacity = toInt(form.capacity);
    const hourlyRate = Number(String(form.hourlyRate ?? "").trim());
    if (!id) return "L'ID area è obbligatorio.";
    if (!/^[A-Z0-9-]{2,20}$/.test(id)) return "ID non valido: usa solo lettere, numeri o trattino (2-20 caratteri).";
    if (!Number.isInteger(capacity) || capacity < 1) return "La capienza deve essere un numero intero >= 1.";
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) return "La tariffa oraria deve essere un numero >= 0.";
    if (areas.some((a) => normalizeId(a.id) === id && normalizeId(a.id) !== normalizeId(editingArea?.id))) return `ID area già esistente: ${id}.`;
    const name = String(form.name ?? "").trim();
    if (name && areas.some((a) => normalizeName(a.name) === normalizeName(name) && normalizeId(a.id) !== normalizeId(editingArea?.id))) return "Nome area già esistente.";
    return null;
  };

  const handleSave = async (onClose) => {
    const ve = validateForm();
    if (ve) { setError(ve); return; }
    setSaving(true); setError("");
    try {
      const updated = await updateArea(editingArea.id, {
        id: normalizeId(form.id), name: String(form.name ?? "").trim() || undefined,
        capacity: toInt(form.capacity), hourlyRate: Number(Number(form.hourlyRate).toFixed(2)),
        isUnderMaintenance: Boolean(form.isUnderMaintenance),
      });
      setAreas((prev) => prev.map((a) => normalizeId(a.id) === normalizeId(editingArea.id) ? updated : a));
      onClose(); setEditingArea(null);
    } catch (err) { setError(err.message || "Errore durante il salvataggio."); }
    finally { setSaving(false); }
  };

  const totalCapacity  = areas.reduce((s, a) => s + Number(a.capacity || 0), 0);
  const totalAvailable = areas.reduce((s, a) => s + Number(a.availableSpots || 0), 0);
  const avgRate        = areas.length > 0 ? areas.reduce((s, a) => s + Number(a.hourlyRate || 0), 0) / areas.length : 0;

  const editBtn = (area) => (
    <Button
      size="sm" variant="flat" onPress={() => openEditModal(area)}
      style={{ color: "#bdb23c", background: "rgba(189,178,60,0.14)", border: "1px solid rgba(189,178,60,0.30)", fontWeight: 700 }}
    >
      Modifica
    </Button>
  );

  return (
    <Layout>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Gestisci Aree</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Visualizza e modifica le aree parcheggio.</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Aree totali",       value: areas.length,               color: "var(--text-primary)" },
          { label: "Capienza totale",   value: totalCapacity,              color: "var(--text-primary)" },
          { label: "Posti disponibili", value: totalAvailable,             color: "#22c55e" },
          { label: "Tariffa media",     value: `€ ${avgRate.toFixed(2)}/h`, color: "#bdb23c" },
        ].map(({ label, value, color }) => (
          <Card key={label} shadow="none" classNames={{ base: CARD_BASE }}>
            <CardBody style={{ padding: "1rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: 0 }}>{label}</p>
              <p style={{ color, fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Input
          placeholder="Cerca per ID o nome area..."
          value={query}
          onValueChange={setQuery}
          variant="bordered"
          classNames={{ ...inputCls, base: "max-w-md" }}
        />
        <Button
          variant="flat" onPress={loadAreas}
          style={{ color: "var(--text-secondary)", background: "var(--surface-04)", border: "1px solid var(--border-default)", fontWeight: 600 }}
        >
          Aggiorna lista
        </Button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" color="warning" label="Caricamento aree..." />
        </div>
      ) : filteredAreas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-subtle)" }}>Nessuna area trovata.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden" style={{ display: "grid", gap: "0.75rem" }}>
            {filteredAreas.map((area) => {
              const occ = Math.max(0, Number(area.capacity || 0) - Number(area.availableSpots || 0));
              const pct = Number(area.capacity) > 0 ? Math.round((occ / Number(area.capacity)) * 100) : 0;
              return (
                <Card key={area.id} shadow="none" classNames={{ base: CARD_BASE }}>
                  <CardBody style={{ padding: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <div style={{ color: "#bdb23c", fontWeight: 800, fontSize: "0.9rem" }}>{area.id}</div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{area.name || `Parcheggio ${area.id}`}</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Chip size="sm" variant="flat" color={pct >= 80 ? "danger" : pct >= 50 ? "warning" : "success"}>{pct}%</Chip>
                        {area.isUnderMaintenance && <Chip size="sm" variant="flat" color="warning">Manutenzione</Chip>}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { label: "Capienza",    value: area.capacity,                                           color: "var(--text-primary)" },
                        { label: "Disponibili", value: area.availableSpots,                                     color: "#22c55e" },
                        { label: "Tariffa",     value: `€ ${Number(area.hourlyRate || 0).toFixed(2)}/h`,         color: "#bdb23c" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: "var(--surface-04)", borderRadius: 10, padding: "0.55rem" }}>
                          <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem" }}>{label}</div>
                          <div style={{ color, fontWeight: 700 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {editBtn(area)}
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block" style={{ background: "var(--surface-04)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
            <Table
              aria-label="Tabella gestione aree"
              removeWrapper
              classNames={{
                th: "bg-transparent text-slate-500 border-b border-black/5 dark:border-white/5 text-xs uppercase tracking-wider",
                td: "border-b border-black/5 dark:border-white/5 text-slate-800 dark:text-slate-200 py-3",
                tr: "hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Nome</TableColumn>
                <TableColumn>Capienza</TableColumn>
                <TableColumn>Disponibili</TableColumn>
                <TableColumn>Tariffa/h</TableColumn>
                <TableColumn>Stato</TableColumn>
                <TableColumn>Occupazione</TableColumn>
                <TableColumn>Azioni</TableColumn>
              </TableHeader>
              <TableBody items={filteredAreas}>
                {(area) => {
                  const occ = Math.max(0, Number(area.capacity || 0) - Number(area.availableSpots || 0));
                  const pct = Number(area.capacity) > 0 ? Math.round((occ / Number(area.capacity)) * 100) : 0;
                  return (
                    <TableRow key={area.id}>
                      <TableCell><span style={{ color: "#bdb23c", fontWeight: 700 }}>{area.id}</span></TableCell>
                      <TableCell><span style={{ fontWeight: 600 }}>{area.name || `Parcheggio ${area.id}`}</span></TableCell>
                      <TableCell>{area.capacity}</TableCell>
                      <TableCell>{area.availableSpots}</TableCell>
                      <TableCell>€ {Number(area.hourlyRate || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={area.isUnderMaintenance ? "warning" : "success"}>
                          {area.isUnderMaintenance ? "Manutenzione" : "Operativa"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={pct >= 80 ? "danger" : pct >= 50 ? "warning" : "success"}>{pct}%</Chip>
                      </TableCell>
                      <TableCell>{editBtn(area)}</TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur"
        classNames={{ backdrop: "bg-black/60", base: "bg-white dark:!bg-[#111827] border border-black/10 dark:border-white/10 rounded-2xl" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: "var(--text-primary)", fontWeight: 700 }}>Modifica area {editingArea?.id}</ModalHeader>
              <ModalBody style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {error && <div className="alert-error">{error}</div>}
                <Input label="ID Area"           labelPlacement="outside" value={form.id}         onValueChange={(v) => setForm((p) => ({ ...p, id: v }))}         variant="bordered" classNames={inputCls} />
                <Input label="Nome area"         labelPlacement="outside" value={form.name}       onValueChange={(v) => setForm((p) => ({ ...p, name: v }))}       variant="bordered" classNames={inputCls} />
                <Input label="Capienza"          labelPlacement="outside" type="number" min="1"   value={form.capacity}  onValueChange={(v) => setForm((p) => ({ ...p, capacity: v }))}  variant="bordered" classNames={inputCls} />
                <Input label="Tariffa oraria (€)" labelPlacement="outside" type="number" min="0" step="0.1" value={form.hourlyRate} onValueChange={(v) => setForm((p) => ({ ...p, hourlyRate: v }))} variant="bordered" classNames={inputCls} />
                <Switch isSelected={form.isUnderMaintenance} color="warning" onValueChange={(v) => setForm((p) => ({ ...p, isUnderMaintenance: v }))}>
                  Area in manutenzione
                </Switch>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} style={{ color: "var(--text-muted)" }}>Annulla</Button>
                <Button
                  isLoading={saving} onPress={() => handleSave(onClose)}
                  className="font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#bdb23c,#9b9b00)" }}
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
