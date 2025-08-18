import axios from "axios";

/**
 * API service configured with backend base URL and JWT support.
 * Uses REACT_APP_BACKEND_URL exclusively as the base URL (no hardcoded URLs).
 * If REACT_APP_BACKEND_URL is not set, a warning is logged and relative paths will be used.
 * Note: Avoid setting a global "Content-Type" header so simple requests can remain CORS simple.
 */
function resolveBaseUrl() {
  const envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
  if (!envUrl) {
    // Warn clearly so environments missing .env can be corrected
    // Keeping empty string allows axios to use relative URLs as a soft fallback
    // but the recommended setup is to provide REACT_APP_BACKEND_URL.
    // eslint-disable-next-line no-console
    console.warn(
      "REACT_APP_BACKEND_URL is not set. API calls will use relative URLs which may fail if not proxied."
    );
    return "";
  }
  // Normalize by removing trailing slash
  return envUrl.replace(/\/$/, "");
}

const BASE_URL = resolveBaseUrl();

// PUBLIC_INTERFACE
export const API_BASE_URL = BASE_URL; // Exposed for display (curl example), not required for axios

// Create axios instance with baseURL; let axios infer per-request headers
const api = axios.create({
  baseURL: BASE_URL || undefined,
  withCredentials: false, // ensure requests are not treated as credentialed (no cookies) to avoid strict CORS paths
  headers: {
    Accept: "application/json",
  },
  timeout: 15000,
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
