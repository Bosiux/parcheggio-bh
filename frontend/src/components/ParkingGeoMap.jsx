import { Card, CardBody, Chip } from "@heroui/react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BRESCIA_CENTER = [45.5416, 10.2118];

function getRiskLevel(available) {
  if (available <= 0) return "danger";
  if (available <= 5) return "warning";
  return "success";
}

function getRiskColor(level) {
  if (level === "danger") return "#ef4444";
  if (level === "warning") return "#f59e0b";
  return "#22c55e";
}

export default function ParkingGeoMap({ title, subtitle, points, mode = "user" }) {
  const mapCenter = points.length > 0
    ? [
        points.reduce((sum, p) => sum + Number(p.lat), 0) / points.length,
        points.reduce((sum, p) => sum + Number(p.lng), 0) / points.length,
      ]
    : BRESCIA_CENTER;

  return (
    <Card
      style={{
        background: "var(--surface-04)",
        border: "1px solid var(--border-soft)",
        marginBottom: "1.75rem",
      }}
    >
      <CardBody style={{ padding: "1rem" }}>
        <div style={{ marginBottom: "0.9rem" }}>
          <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
          <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.82rem" }}>{subtitle}</p>
        </div>

        <div
          style={{
            width: "100%",
            minHeight: 380,
            borderRadius: 14,
            border: "1px solid rgba(189,178,60,0.18)",
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ width: "100%", height: 380 }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {points.map((point) => {
              const riskLevel = point.isUnderMaintenance ? "warning" : getRiskLevel(point.available);
              return (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={10}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: getRiskColor(riskLevel),
                    fillOpacity: 0.95,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                    <div style={{ fontWeight: 700 }}>{point.label}</div>
                  </Tooltip>

                  <Popup>
                    <div style={{ minWidth: 170 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{point.label}</div>
                        <Chip size="sm" color={riskLevel} variant="flat">
                          {point.id}
                        </Chip>
                      </div>

                      {mode === "admin" ? (
                        <div style={{ display: "grid", gap: "0.25rem", fontSize: "0.8rem" }}>
                          <div>Stato: <strong>{point.isUnderMaintenance ? "In manutenzione" : "Operativa"}</strong></div>
                          <div>Posti liberi: <strong>{point.available}</strong></div>
                          <div>Occupati: <strong>{point.occupied}</strong></div>
                          <div>Ricavi oggi: <strong>EUR {point.revenue.toFixed(2)}</strong></div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.8rem" }}>
                          {point.isUnderMaintenance
                            ? "Area in manutenzione"
                            : <>Posti disponibili: <strong>{point.available}</strong></>}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </CardBody>
    </Card>
  );
}
