import { api } from "./client.js";

export const getAreas = async () => api.get("/parking/areas");

export const getAvailability = async (areaId) =>
  api.get(`/parking/areas/${encodeURIComponent(areaId)}/availability`);

export const bookArea = async (areaId, details) =>
  api.post(`/parking/areas/${encodeURIComponent(areaId)}/book`, details || {});

export const getMyBookings = async () => api.get("/parking/bookings/me");

export const cancelBooking = async (bookingId) =>
  api.post(`/parking/bookings/${encodeURIComponent(bookingId)}/cancel`);
