import axios from "axios";

/**
 * API service configured with backend base URL and JWT support.
 * Reads REACT_APP_BACKEND_URL from environment. If not set, will default to:
 *  - http(s)://<host>:3001 in development (when running on port 3000)
 *  - same-origin in other cases (empty string baseURL)
 *
 * This improves reliability in local dev without hard-coding addresses.
 */

// Resolve base URL from env or infer sensible defaults for dev
const ENV_BASE = (process.env.REACT_APP_BACKEND_URL || "").trim();

/**
 * Determine effective backend base URL.
 * - If REACT_APP_BACKEND_URL is provided, use it.
 * - Else, if running on dev port 3000, try same host on port 3001.
 * - Otherwise, fall back to same-origin (relative paths).
 */
// PUBLIC_INTERFACE
export function getBaseUrl() {
  /** Returns the computed backend base URL used by the API client. */
  if (ENV_BASE) return ENV_BASE;
  if (typeof window !== "undefined" && window.location) {
    if (window.location.port === "3000") {
      const proto = window.location.protocol;
      const host = window.location.hostname;
      return `${proto}//${host}:3001`;
    }
  }
  return ""; // same-origin
}

const BASE_URL = getBaseUrl();

// Axios instance for consistent headers and base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Reasonable timeout to surface connectivity issues clearly
  timeout: 15000,
});

// Current token value stored in module scope and mirrored to localStorage by AuthContext
let currentToken = null;

// Attach Authorization header if token present and log it in development
api.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }

  // Log outgoing Authorization header (development only)
  if (process.env.NODE_ENV !== "production") {
    try {
      const fullUrl = (config.baseURL || "") + (config.url || "");
      // eslint-disable-next-line no-console
      console.debug("[api] Request", {
        method: (config.method || "get").toUpperCase(),
        url: fullUrl,
        Authorization: config.headers?.Authorization || "(none)",
      });
    } catch {
      // ignore logging errors
    }
  }
  return config;
});

// Enhance error messages for 401 and network/CORS/misconfiguration issues
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Friendly Unauthorized messaging
    if (error?.response?.status === 401) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[api] 401 Unauthorized response", {
          url: (error?.config?.baseURL || "") + (error?.config?.url || ""),
          Authorization: error?.config?.headers?.Authorization || "(none)",
        });
      }
      const friendly401 = new Error(
        "Unauthorized (401): Your session may be invalid or expired. Please log in again."
      );
      friendly401.original = error;
      friendly401.response = error.response;
      return Promise.reject(friendly401);
    }

    const isNetworkIssue =
      (!error?.response &&
        (error?.code === "ERR_NETWORK" ||
          (error?.message || "").toLowerCase().includes("network"))) ||
      error?.message === "Network Error";

    if (isNetworkIssue) {
      try {
        const frontendOrigin =
          typeof window !== "undefined" && window.location
            ? window.location.origin
            : "frontend";
        const backendBase = BASE_URL || frontendOrigin;
        const friendly = [
          "NetworkError: Failed to reach the backend.",
          `- Attempted base URL: ${backendBase}`,
          "- Possible causes:",
          "  • REACT_APP_BACKEND_URL not set or incorrect",
          "  • Backend is not running or not accessible",
          `  • CORS not allowing origin ${frontendOrigin}`,
          "  • Mixed-content or TLS/hostname mismatch",
          "",
          "Resolution:",
          "  • Set REACT_APP_BACKEND_URL in your .env to your backend URL (e.g., http://localhost:3001)",
          "  • Ensure backend CORS allows the frontend origin",
          "  • Verify backend is reachable via the browser",
        ].join("\n");
        const wrapped = new Error(friendly);
        wrapped.original = error;
        wrapped.response = error.response;
        return Promise.reject(wrapped);
      } catch {
        // If any error occurs during wrapping, reject original error
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

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
   * The backend expects application/x-www-form-urlencoded; include both 'username' and 'email' aliases.
   */
  const { email, password } = payload || {};
  const body = new URLSearchParams();
  // OAuth2PasswordRequestForm uses 'username'; OpenAPI indicates 'email' alias - send both for compatibility
  if (email) {
    body.append("username", email);
    body.append("email", email);
  }
  if (password) body.append("password", password);

  const res = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
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
export async function getPlan() {
  /** Retrieve current user's plan/package tier. Requires auth. */
  const res = await api.get("/account/plan");
  return res.data;
}

// PUBLIC_INTERFACE
export async function updatePlan(package_tier) {
  /**
   * Update current user's plan/package tier. Requires auth.
   * package_tier: 'free' | 'pro' | 'enterprise'
   */
  const res = await api.put("/account/plan", { package_tier });
  return res.data;
}

// PUBLIC_INTERFACE
export async function health() {
  /** Simple health check to verify backend connectivity. */
  const res = await api.get("/");
  return res.data;
}

export default {
  getBaseUrl,
  setToken,
  login,
  signup,
  getDashboard,
  getTailoredContent,
  getPlan,
  updatePlan,
  health,
};
