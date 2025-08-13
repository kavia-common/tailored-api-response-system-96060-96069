import axios from "axios";

/**
 * API service configured with backend base URL and JWT support.
 * Reads REACT_APP_BACKEND_URL from environment. If not set, will default to same-origin.
 */
const BASE_URL = process.env.REACT_APP_BACKEND_URL || "";

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
  setToken,
  login,
  signup,
  getDashboard,
  getTailoredContent,
  getPlan,
  updatePlan,
  health,
};
