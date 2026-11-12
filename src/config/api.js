import axios from "axios";

/**
 * Centralized API & Service Configuration
 * Resolves endpoints dynamically from environment variables for production readiness.
 */

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : "http://localhost:3002");

export const AUTH_PORTAL_URL =
  process.env.REACT_APP_AUTH_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000");

export const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `ws://${window.location.hostname}:3002`
    : "ws://localhost:3002");

// Automatically attach Bearer JWT token to all outgoing axios requests
axios.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("zerodha_token");
    if (token && (!config.headers.Authorization && !config.headers.authorization)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

export default {
  API_BASE,
  AUTH_PORTAL_URL,
  WS_URL,
};
