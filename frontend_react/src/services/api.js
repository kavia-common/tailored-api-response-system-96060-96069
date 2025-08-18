import axios from "axios";

/**
 * API service configured with backend base URL and JWT support.
 * Reads REACT_APP_BACKEND_URL from environment. If not set, falls back to provided backend URL.
 * Note: Avoid setting a global "Content-Type" header so simple requests can remain CORS simple.
 */
const BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://vscode-internal-38494-beta.beta01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
export const API_BASE_URL = BASE_URL; // Base URL used by API client. Configured via REACT_APP_BACKEND_URL.

// Create axios instance with only baseURL; let axios infer per-request headers
const api = axios.create({
  baseURL: BASE_URL,
});

// Current token value stored in module scope and mirrored to localStorage by AuthContext
let currentToken = null;

// Attach Authorization header if token present
api.interceptors.request.use((config) => {
  if (currentToken) {
    // Authorization header may trigger CORS preflight; backend must allow it
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// PUBLIC_INTERFACE
export function setToken(token) {
  /** Set JWT token for subsequent API requests. */
  currentToken = token || null;
}

// PUBLIC_INTERFACE
export async function login(payload) {
  /**
   * Login and return TokenResponse.
   * payload: { email: string, password: string }
   *
   * Send as application/x-www-form-urlencoded to match backend schema and avoid unnecessary preflight.
   */
  const form = new URLSearchParams();
  // Backend accepts 'email' (alias of 'username') and 'password'
  form.set("email", String(payload?.email || ""));
  form.set("password", String(payload?.password || ""));
  const res = await api.post("/auth/login", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.data;
}

// PUBLIC_INTERFACE
export async function signup(payload) {
  /**
   * Signup and return TokenResponse.
   * payload: { email: string, password: string, package_tier?: 'free'|'pro'|'enterprise' }
   * Backend expects JSON for signup.
   */
  const res = await api.post("/auth/signup", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

// PUBLIC_INTERFACE
export async function getDashboard() {
  /** Get DashboardResponse for the current user. Requires auth. */
  const res = await api.get("/dashboard/me");
  return res.data;
}

// PUBLIC_INTERFACE
export async function getTailoredContent() {
  /** Get TailoredContentResponse for the current user. Requires auth. */
  const res = await api.get("/api/content");
  return res.data;
}

// PUBLIC_INTERFACE
export async function health() {
  /** Simple health check to verify backend connectivity. */
  const res = await api.get("/");
  return res.data;
}

export default {
  setToken,
  login,
  signup,
  getDashboard,
  getTailoredContent,
  health,
};
