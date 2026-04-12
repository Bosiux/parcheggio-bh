// src/api/admin.api.js — MOCK TEMPORANEO

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const normalizeAreaId = (value) => String(value ?? "").trim().toUpperCase();
const normalizeAreaName = (value) => String(value ?? "").trim().toLowerCase();

const AREAS = [
  { id: "P01", name: "Parcheggio Centro",   capacity: 50, availableSpots: 12 },
  { id: "P02", name: "Parcheggio Stazione", capacity: 80, availableSpots: 45 },
  { id: "P03", name: "Parcheggio Ospedale", capacity: 30, availableSpots: 0  },
  { id: "P04", name: "Parcheggio Via Roma", capacity: 20, availableSpots: 18 },
  { id: "P05", name: "Parcheggio Castello", capacity: 60, availableSpots: 7  },
];

const ALL_BOOKINGS = [
  { id: "BK001", userId: 1, user: { username: "user"  }, areaId: "P01", area: { name: "Parcheggio Centro"   }, startTime: new Date(Date.now() - 2  * 3600000).toISOString(), endTime: new Date(Date.now() - 1  * 3600000).toISOString(), status: "completed" },
  { id: "BK002", userId: 1, user: { username: "user"  }, areaId: "P02", area: { name: "Parcheggio Stazione" }, startTime: new Date(Date.now() - 24 * 3600000).toISOString(), endTime: new Date(Date.now() - 23 * 3600000).toISOString(), status: "completed" },
  { id: "BK003", userId: 1, user: { username: "user"  }, areaId: "P04", area: { name: "Parcheggio Via Roma" }, startTime: new Date(Date.now() + 10 * 60000 ).toISOString(), endTime: new Date(Date.now() + 70 * 60000 ).toISOString(), status: "active"    },
  { id: "BK005", userId: 3, user: { username: "giulia"}, areaId: "P01", area: { name: "Parcheggio Centro"   }, startTime: new Date(Date.now() - 5  * 3600000).toISOString(), endTime: new Date(Date.now() - 4  * 3600000).toISOString(), status: "completed" },
  { id: "BK006", userId: 4, user: { username: "luca"  }, areaId: "P03", area: { name: "Parcheggio Ospedale" }, startTime: new Date(Date.now() - 1  * 3600000).toISOString(), endTime: new Date(Date.now() + 0  * 3600000).toISOString(), status: "active"    },
  { id: "BK007", userId: 3, user: { username: "giulia"}, areaId: "P05", area: { name: "Parcheggio Castello" }, startTime: new Date(Date.now() - 48 * 3600000).toISOString(), endTime: new Date(Date.now() - 47 * 3600000).toISOString(), status: "expired"   },
  { id: "BK008", userId: 5, user: { username: "marco" }, areaId: "P02", area: { name: "Parcheggio Stazione" }, startTime: new Date(Date.now() - 3  * 3600000).toISOString(), endTime: new Date(Date.now() - 2  * 3600000).toISOString(), status: "completed" },
];

// Genera statistiche giornaliere per gli ultimi 30 giorni
function generateStats(areaId) {
  const stats = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    stats.push({
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 40) + (areaId === "P02" ? 20 : 5),
    });
  }
  return stats;
}

export const getAllAreas = async () => { await delay(400); return [...AREAS]; };

export const addArea = async (data) => {
  await delay(700);
  const normalizedId = normalizeAreaId(data?.id);
  const normalizedName = String(data?.name ?? "").trim();

  if (!normalizedId) throw new Error("ID area obbligatorio.");

  if (AREAS.some((a) => normalizeAreaId(a.id) === normalizedId)) {
    throw new Error(`ID area già esistente: ${normalizedId}.`);
  }

  if (normalizedName && AREAS.some((a) => normalizeAreaName(a.name) === normalizeAreaName(normalizedName))) {
    throw new Error("Nome area già esistente.");
  }

  const newArea = {
    ...data,
    id: normalizedId,
    name: normalizedName || undefined,
    availableSpots: data.capacity,
  };
  AREAS.push(newArea);
  return newArea;
};

export const updateArea = async (areaId, patch) => {
  await delay(650);

  const currentId = normalizeAreaId(areaId);
  const idx = AREAS.findIndex((a) => normalizeAreaId(a.id) === currentId);
  if (idx === -1) throw new Error("Area non trovata.");

  const existing = AREAS[idx];
  const nextId = normalizeAreaId(patch?.id ?? existing.id);
  const nextNameRaw = String((patch?.name ?? existing.name ?? "")).trim();
  const nextCapacity = Number(patch?.capacity ?? existing.capacity);
  const nextAvailable = Number(patch?.availableSpots ?? existing.availableSpots);

  if (!nextId) throw new Error("ID area obbligatorio.");
  if (!Number.isInteger(nextCapacity) || nextCapacity < 1) {
    throw new Error("La capienza deve essere un numero intero >= 1.");
  }
  if (!Number.isInteger(nextAvailable) || nextAvailable < 0) {
    throw new Error("I posti disponibili devono essere un numero intero >= 0.");
  }
  if (nextAvailable > nextCapacity) {
    throw new Error("I posti disponibili non possono superare la capienza.");
  }

  const occupiedBefore = Math.max(0, Number(existing.capacity) - Number(existing.availableSpots));
  if (nextCapacity < occupiedBefore) {
    throw new Error(`Capienza troppo bassa: attualmente ci sono ${occupiedBefore} posti occupati.`);
  }

  if (AREAS.some((a, i) => i !== idx && normalizeAreaId(a.id) === nextId)) {
    throw new Error(`ID area già esistente: ${nextId}.`);
  }

  if (
    nextNameRaw &&
    AREAS.some(
      (a, i) => i !== idx && normalizeAreaName(a.name) === normalizeAreaName(nextNameRaw)
    )
  ) {
    throw new Error("Nome area già esistente.");
  }

  const updatedArea = {
    ...existing,
    id: nextId,
    name: nextNameRaw || undefined,
    capacity: nextCapacity,
    availableSpots: nextAvailable,
  };
  AREAS[idx] = updatedArea;

  ALL_BOOKINGS.forEach((booking) => {
    if (normalizeAreaId(booking.areaId) === currentId) {
      booking.areaId = nextId;
      booking.area = {
        ...(booking.area || {}),
        name: updatedArea.name || `Parcheggio ${nextId}`,
      };
    }
  });

  return updatedArea;
};

export const getAllBookings = async () => { await delay(500); return [...ALL_BOOKINGS]; };

export const getDailyStats = async (areaId) => {
  await delay(600);
  return generateStats(areaId || null);
};

export const deleteArea = async (areaId) => {
  await delay(500);
  const normalizedId = normalizeAreaId(areaId);
  const idx = AREAS.findIndex((a) => normalizeAreaId(a.id) === normalizedId);
  if (idx === -1) throw new Error("Area non trovata.");
  AREAS.splice(idx, 1);
  return null;
};
