import { api } from "./client.js";

export const getAllAreas = async () => api.get("/admin/areas");

export const addArea = async (data) => api.post("/admin/areas", data || {});

export const updateArea = async (areaId, patch) =>
  api.put(`/admin/areas/${encodeURIComponent(areaId)}`, patch || {});

export const getAllBookings = async () => api.get("/admin/bookings");

export const getDailyStats = async (areaId) => {
  const suffix = areaId ? `?areaId=${encodeURIComponent(areaId)}` : "";
  return api.get(`/admin/stats/daily${suffix}`);
};

export const deleteArea = async (areaId) =>
  api.delete(`/admin/areas/${encodeURIComponent(areaId)}`);

export const getRevenueStats = async (period = "30d") =>
  api.get(`/admin/stats/revenue?period=${encodeURIComponent(period)}`);
