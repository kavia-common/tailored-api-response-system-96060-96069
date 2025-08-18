import axios from "axios";

/**
 * API service configured with backend base URL and JWT support.
 * Reads REACT_APP_BACKEND_URL from environment. If not set, will default to same-origin.
 */
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "https://vscode-internal-38494-beta.beta01.cloud.kavia.ai:3001";
// PUBLIC_INTERFACE
export const API_BASE_URL = BASE_URL; // Base URL used by API client. Configured via REACT_APP_BACKEND_URL.

// Axios instance for consistent headers and base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Current token value stored in module scope and mirrored to localStorage by AuthContext
let currentToken = null;

// Attach Authorization header if token present
api.interceptors.request.use((config) => {
  if (currentToken) {
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
   */
  const res = await api.post("/auth/login", payload);
  return res.data;
}

// PUBLIC_INTERFACE
export async function signup(payload) {
  /**
   * Signup and return TokenResponse.
   * payload: { email: string, password: string, package_tier?: 'free'|'pro'|'enterprise' }
   */
  const res = await api.post("/auth/signup", payload);
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
