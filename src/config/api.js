import axios from "axios";

/**
 * Centralized API & Service Configuration
 * Resolves endpoints dynamically from environment variables for production readiness.
 */

function readEnv(viteKey, legacyKey) {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env[viteKey]) return import.meta.env[viteKey];
      if (import.meta.env[legacyKey]) return import.meta.env[legacyKey];
    }
  } catch (e) {}
  try {
    if (typeof process !== "undefined" && process.env && process.env[legacyKey]) {
      return process.env[legacyKey];
    }
  } catch (e) {}
  return "";
}

export const API_BASE =
  readEnv("VITE_API_BASE_URL", "REACT_APP_API_BASE_URL") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : "http://localhost:3002");

export const AUTH_PORTAL_URL =
  readEnv("VITE_AUTH_URL", "REACT_APP_AUTH_URL") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000");

export const WS_URL =
  readEnv("VITE_WS_URL", "REACT_APP_WS_URL") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `ws://${window.location.hostname}:3002`
    : "ws://localhost:3002");

export function readCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

axios.defaults.withCredentials = true;

// Automatically attach CSRF token from cookie on state-changing requests
axios.interceptors.request.use((config) => {
  try {
    const method = String(config.method || "get").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const csrf = readCookie("zerodha_csrf");
      if (csrf) {
        config.headers["X-CSRF-Token"] = csrf;
      }
    }
  } catch (e) {}
  return config;
});

export default {
  API_BASE,
  AUTH_PORTAL_URL,
  WS_URL,
};
