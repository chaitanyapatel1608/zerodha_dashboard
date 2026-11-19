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

const isRender = typeof window !== "undefined" && window.location.hostname.includes("onrender.com");

export const API_BASE =
  readEnv("VITE_API_BASE_URL", "REACT_APP_API_BASE_URL") ||
  (isRender
    ? "https://zerodha-backend-xbtx.onrender.com"
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : "http://localhost:3002");

export const AUTH_PORTAL_URL =
  readEnv("VITE_AUTH_URL", "REACT_APP_AUTH_URL") ||
  (isRender
    ? "https://zerodha-frontend-58j9.onrender.com"
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000");

export const WS_URL =
  readEnv("VITE_WS_URL", "REACT_APP_WS_URL") ||
  (isRender
    ? "wss://zerodha-backend-xbtx.onrender.com"
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `ws://${window.location.hostname}:3002`
    : "ws://localhost:3002");

export function readCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

let inMemoryCsrf = "";

export function setCsrfToken(token) {
  if (token) {
    inMemoryCsrf = token;
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("zerodha_csrf", token);
    } catch (e) {}
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("zerodha_csrf", token);
    } catch (e) {}
  }
}

export function getCsrfToken() {
  const cookieVal = readCookie("zerodha_csrf");
  if (cookieVal) return cookieVal;
  if (inMemoryCsrf) return inMemoryCsrf;
  try {
    if (typeof sessionStorage !== "undefined") {
      const s = sessionStorage.getItem("zerodha_csrf");
      if (s) return s;
    }
  } catch (e) {}
  try {
    if (typeof localStorage !== "undefined") {
      const l = localStorage.getItem("zerodha_csrf");
      if (l) return l;
    }
  } catch (e) {}
  return "";
}

axios.defaults.withCredentials = true;

// Automatically attach CSRF token and Bearer token if present
axios.interceptors.request.use(async (config) => {
  try {
    const storedToken =
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("zerodha_token")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("zerodha_token")) ||
      "";
    if (storedToken) {
      config.headers = config.headers || {};
      if (!config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${storedToken}`;
      }
    }

    const method = String(config.method || "get").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      let csrf = getCsrfToken();
      if (!csrf && !config.skipCsrfFetch && typeof window !== "undefined") {
        try {
          const res = await axios.get(`${API_BASE}/csrf-token`, {
            withCredentials: true,
            skipCsrfFetch: true,
          });
          if (res?.data?.csrfToken) {
            csrf = res.data.csrfToken;
            setCsrfToken(csrf);
          }
        } catch (_) {}
      }
      if (csrf) {
        config.headers = config.headers || {};
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
