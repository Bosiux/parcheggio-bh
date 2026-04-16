// src/api/mockDb.js — mock store condiviso

export const AREAS = [
  { id: "P01", name: "Parcheggio Centro", capacity: 50, availableSpots: 12, hourlyRate: 2.5, isUnderMaintenance: false, mapPoint: { lat: 45.5418, lng: 10.2176 } },
  { id: "P02", name: "Parcheggio Stazione", capacity: 80, availableSpots: 45, hourlyRate: 2.0, isUnderMaintenance: false, mapPoint: { lat: 45.5329, lng: 10.2165 } },
  { id: "P03", name: "Parcheggio Ospedale", capacity: 30, availableSpots: 0, hourlyRate: 1.5, isUnderMaintenance: false, mapPoint: { lat: 45.5485, lng: 10.2189 } },
  { id: "P04", name: "Parcheggio Via Roma", capacity: 20, availableSpots: 18, hourlyRate: 2.2, isUnderMaintenance: false, mapPoint: { lat: 45.5368, lng: 10.2291 } },
  { id: "P05", name: "Parcheggio Castello", capacity: 60, availableSpots: 7, hourlyRate: 1.8, isUnderMaintenance: false, mapPoint: { lat: 45.5467, lng: 10.2198 } },
];
