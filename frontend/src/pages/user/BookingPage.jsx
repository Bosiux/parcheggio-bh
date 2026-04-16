// src/pages/user/BookingPage.jsx
import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { bookArea, getAvailability } from "../../api/parking.api.js";
import Layout from "../../components/Layout.jsx";

export default function BookingPage() {
  const { areaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [area, setArea] = useState(location.state?.area || null);
  const [availability, setAvailability] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const nowPlusOneHour = new Date(Date.now() + 60 * 60000);
  const [startDate, setStartDate] = useState(nowPlusOneHour.toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState(
    `${String(nowPlusOneHour.getHours()).padStart(2, "0")}:${String(nowPlusOneHour.getMinutes()).padStart(2, "0")}`
  );
  const [durationHours, setDurationHours] = useState("1");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const data = await getAvailability(areaId);
        setAvailability(data);
        if (!area) setArea(data);
      } catch (err) {
        setError(err.message || "Errore nel caricamento disponibilità.");
      } finally {
        setLoadingAvail(false);
      }
    };
    fetchAvailability();
  }, [areaId, area]);

  const handleConfirmBooking = async (onClose) => {
    setLoading(true);
    setError("");
    try {
      const result = await bookArea(areaId, {
        startDate,
        startHour,
        durationHours,
      });
      setBooking(result);
      setSuccess(true);
      onClose();
    } catch (err) {
      setError(err.message || "Errore durante la prenotazione.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const areaName = area?.name || `Parcheggio ${areaId}`;
  const isUnderMaintenance = Boolean(availability?.isUnderMaintenance ?? area?.isUnderMaintenance);
  const available = availability?.availableSpots ?? availability?.available ?? area?.availableSpots ?? area?.available ?? "—";
  const total = availability?.capacity ?? availability?.total ?? area?.capacity ?? area?.total ?? "—";
  const hourlyRate = Number(availability?.hourlyRate ?? area?.hourlyRate ?? 0);
  const previewTotal = isUnderMaintenance ? 0 : Number((hourlyRate * Number(durationHours || 0)).toFixed(2));

  if (success && booking) {
    return (
      <Layout>
        <div style={{ maxWidth: 500, margin: "3rem auto", textAlign: "center" }}>
          {/* Success animation */}
          <div
            style={{
              width: 96,
              height: 96,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              margin: "0 auto 1.5rem",
              boxShadow: "0 20px 40px rgba(34,197,94,0.3)",
              animation: "popIn 0.4s ease",
            }}
          >
            ✓
          </div>
          <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Prenotazione Confermata!
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
            Il tuo posto è stato riservato con successo.
          </p>

          <Card
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              marginBottom: "1.5rem",
            }}
          >
            <CardBody style={{ padding: "1.5rem", textAlign: "left" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Area", value: areaName },
                  { label: "ID Prenotazione", value: booking.id || "—" },
                  { label: "Data e ora inizio", value: booking.startTime ? new Date(booking.startTime).toLocaleString("it-IT") : "—" },
                  { label: "Durata", value: booking.duration || "—" },
                  { label: "Tariffa", value: `€ ${(booking.hourlyRate ?? hourlyRate).toFixed(2)}/h` },
                  { label: "Totale", value: `€ ${(booking.totalPrice ?? previewTotal).toFixed(2)}` },
                  { label: "Scadenza", value: booking.endTime ? new Date(booking.endTime).toLocaleString("it-IT") : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--surface-05)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{label}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.875rem" }}>{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Button
              variant="flat"
              onPress={() => navigate("/history")}
              style={{ color: "var(--text-secondary)" }}
            >
              Vedi storico
            </Button>
            <Button
              onPress={() => navigate("/dashboard")}
              style={{ background: "linear-gradient(135deg, #bdb23c, #9b9b00)", color: "white", fontWeight: 600 }}
            >
              Torna alla dashboard
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back button */}
      <Button
        variant="flat"
        size="sm"
        onPress={() => navigate("/dashboard")}
        style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}
      >
        ← Torna alla Dashboard
      </Button>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Prenota Parcheggio
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Verifica la disponibilità e conferma la prenotazione.
        </p>

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
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Area info card */}
        <Card
          style={{
            background: "var(--surface-04)",
            border: "1px solid rgba(189,178,60,0.2)",
            marginBottom: "1.5rem",
          }}
        >
          <CardBody style={{ padding: "1.75rem" }}>
            {loadingAvail ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Spinner color="primary" label="Verifica disponibilità..." />
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      AREA {areaId}
                    </span>
                    <h2 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.3rem", margin: "0.25rem 0 0" }}>
                      {areaName}
                    </h2>
                  </div>
                  <Chip
                    color={isUnderMaintenance ? "warning" : available === 0 ? "danger" : available < total * 0.3 ? "warning" : "success"}
                    variant="flat"
                  >
                    {isUnderMaintenance ? "In manutenzione" : `${available} posti liberi`}
                  </Chip>
                </div>

                {isUnderMaintenance && (
                  <div
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.35)",
                      borderRadius: 10,
                      padding: "0.8rem 1rem",
                      color: "#fcd34d",
                      marginBottom: "1rem",
                    }}
                  >
                    Area temporaneamente in manutenzione: prenotazione e costi sospesi.
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                    padding: "1rem",
                    background: "var(--surface-04)",
                    borderRadius: 10,
                    marginBottom: "1.5rem",
                  }}
                >
                  {[
                    { label: "Posti liberi", value: available, color: "#22c55e" },
                    { label: "Occupati", value: total !== "—" && available !== "—" ? total - available : "—", color: "#ef4444" },
                    { label: "Capienza", value: total, color: "var(--text-secondary)" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ color, fontWeight: 800, fontSize: "1.5rem" }}>{value}</div>
                      <div style={{ color: "var(--text-subtle)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Booking details */}
                <div
                  style={{
                    background: "rgba(189,178,60,0.06)",
                    border: "1px solid rgba(189,178,60,0.15)",
                    borderRadius: 10,
                    padding: "1rem",
                  }}
                >
                  <h3 style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                    Dettagli prenotazione
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      marginBottom: "0.9rem",
                    }}
                  >
                    <Input
                      type="date"
                      label="Data inizio"
                      labelPlacement="outside"
                      value={startDate}
                      onValueChange={setStartDate}
                      variant="bordered"
                    />
                    <Input
                      type="time"
                      label="Ora inizio"
                      labelPlacement="outside"
                      value={startHour}
                      onValueChange={setStartHour}
                      variant="bordered"
                    />
                    <Select
                      label="Durata prenotazione"
                      labelPlacement="outside"
                      selectedKeys={new Set([durationHours])}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0];
                        if (value) setDurationHours(String(value));
                      }}
                      variant="bordered"
                    >
                      {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                        <SelectItem key={String(h)}>{`${h} ore`}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {[
                      { label: "Tariffa", value: isUnderMaintenance ? "Sospesa" : `€ ${hourlyRate.toFixed(2)}/h`, icon: "💳" },
                      { label: "Durata", value: `${durationHours} ore`, icon: "⏱️" },
                      { label: "Totale stimato", value: isUnderMaintenance ? "N/A" : `€ ${previewTotal.toFixed(2)}`, icon: "🧾" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-subtle)", fontSize: "0.875rem" }}>{icon} {label}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.875rem" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* CTA */}
        <Button
          id="confirm-booking-btn"
          fullWidth
          size="lg"
          isDisabled={loadingAvail || isUnderMaintenance || available === 0 || !startDate || !startHour || !durationHours}
          onPress={onOpen}
          style={{
            background: isUnderMaintenance || available === 0 ? "var(--surface-05)" : "linear-gradient(135deg, #bdb23c, #9b9b00)",
            color: isUnderMaintenance || available === 0 ? "var(--text-subtle)" : "white",
            fontWeight: 700,
            fontSize: "1rem",
            height: 56,
            boxShadow: isUnderMaintenance || available === 0 ? "none" : "0 10px 30px rgba(189,178,60,0.35)",
          }}
        >
          {isUnderMaintenance
            ? "Area in manutenzione — Prenotazione disattivata"
            : available === 0
            ? "Parcheggio pieno — Impossibile prenotare"
            : "Conferma Prenotazione"}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        classNames={{
          base: "dark",
          backdrop: "bg-black/60",
        }}
        style={{ background: "var(--panel-bg)", border: "1px solid var(--border-default)" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                Conferma prenotazione
              </ModalHeader>
              <ModalBody>
                <p style={{ color: "var(--text-secondary)" }}>
                  Stai per prenotare un posto in <strong style={{ color: "var(--text-primary)" }}>{areaName}</strong> con inizio <strong style={{ color: "var(--text-primary)" }}>{new Date(`${startDate}T${startHour}:00`).toLocaleString("it-IT")}</strong> per la durata di <strong style={{ color: "var(--text-primary)" }}>{durationHours} ore</strong>.
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  Totale previsto: <strong style={{ color: "var(--text-primary)" }}>€ {previewTotal.toFixed(2)}</strong>
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} style={{ color: "var(--text-muted)" }}>
                  Annulla
                </Button>
                <Button
                  id="modal-confirm-btn"
                  isLoading={loading}
                  onPress={() => handleConfirmBooking(onClose)}
                  style={{
                    background: "linear-gradient(135deg, #bdb23c, #9b9b00)",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  Conferma
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Layout>
  );
}
