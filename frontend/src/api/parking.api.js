// src/api/parking.api.js — MOCK TEMPORANEO

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const AREAS = [
  { id: "P01", name: "Parcheggio Centro",   capacity: 50, availableSpots: 12 },
  { id: "P02", name: "Parcheggio Stazione", capacity: 80, availableSpots: 45 },
  { id: "P03", name: "Parcheggio Ospedale", capacity: 30, availableSpots: 0  },
  { id: "P04", name: "Parcheggio Via Roma", capacity: 20, availableSpots: 18 },
  { id: "P05", name: "Parcheggio Castello", capacity: 60, availableSpots: 7  },
];

const MY_BOOKINGS = [
  {
    id: "BK001", areaId: "P01", areaName: "Parcheggio Centro",
    startTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    endTime:   new Date(Date.now() - 1 * 3600000).toISOString(),
    duration: "1h", status: "completed",
  },
  {
    id: "BK002", areaId: "P02", areaName: "Parcheggio Stazione",
    startTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    endTime:   new Date(Date.now() - 23 * 3600000).toISOString(),
    duration: "1h", status: "completed",
  },
  {
    id: "BK003", areaId: "P04", areaName: "Parcheggio Via Roma",
    startTime: new Date(Date.now() + 10 * 60000).toISOString(),
    endTime:   new Date(Date.now() + 70 * 60000).toISOString(),
    duration: "1h", status: "active",
  },
  {
    id: "BK004", areaId: "P05", areaName: "Parcheggio Castello",
    startTime: new Date(Date.now() - 72 * 3600000).toISOString(),
    endTime:   new Date(Date.now() - 71 * 3600000).toISOString(),
    duration: "1h", status: "expired",
  },
];

export const getAreas = async () => { await delay(500); return [...AREAS]; };

export const getAvailability = async (areaId) => {
  await delay(400);
  const area = AREAS.find((a) => a.id === areaId);
  if (!area) throw new Error("Area non trovata.");
  return area;
};

export const bookArea = async (areaId) => {
  await delay(800);
  const area = AREAS.find((a) => a.id === areaId);
  if (!area) throw new Error("Area non trovata.");
  if (area.availableSpots === 0) throw new Error("Nessun posto disponibile.");
  area.availableSpots = Math.max(0, area.availableSpots - 1);
  const now = new Date();
  const booking = {
    id: "BK" + Math.floor(Math.random() * 90000 + 10000),
    areaId, areaName: area.name,
    startTime: now.toISOString(),
    endTime: new Date(now.getTime() + 3600000).toISOString(),
    duration: "1h", status: "active",
  };
  MY_BOOKINGS.unshift(booking);
  return booking;
};

export const getMyBookings = async () => { await delay(500); return [...MY_BOOKINGS]; };
