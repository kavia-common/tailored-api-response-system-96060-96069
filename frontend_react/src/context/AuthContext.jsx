import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api";
import { extractErrorMessage, parseValidationErrors } from "../utils/error";

/**
 * AuthContext provides authentication state and actions (login, signup, logout)
 * and the current user's profile/package.
 */

const AuthContext = createContext(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provide authentication state and actions to descendants. */
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Store parsed field-level validation errors (e.g., from FastAPI 422)
  const [validationErrors, setValidationErrors] = useState({});

  // Keep API token in sync
  useEffect(() => {
    api.setToken(token);
  }, [token]);

  // Load profile if token present on mount
  useEffect(() => {
    const init = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await api.getDashboard();
        setUser(data?.user || null);
        localStorage.setItem(USER_KEY, JSON.stringify(data?.user || null));
      } catch (e) {
        // Token may be invalid
        console.warn("Failed to fetch profile during init", e);
        doLogout();
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistToken = useCallback((newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const persistUser = useCallback((u) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const doLogin = useCallback(async (email, password) => {
    /**
     * PUBLIC_INTERFACE
     * Login user and populate token and profile.
     */
    setError(null);
    setValidationErrors({});
    setLoading(true);
    try {
      const tokenRes = await api.login({ email, password });
      persistToken(tokenRes?.access_token);
      const dash = await api.getDashboard();
      persistUser(dash?.user || null);
      return { ok: true };
    } catch (e) {
      // Avoid leaking complex objects to UI; keep a friendly string
      setError(extractErrorMessage(e, "Login failed"));
      persistToken(null);
      persistUser(null);
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [persistToken, persistUser]);

  const doSignup = useCallback(async (email, password, packageTier) => {
    /**
     * PUBLIC_INTERFACE
     * Signup user (optionally with package tier) and populate token and profile.
     * Also parses FastAPI 422 errors to surface field-specific validation feedback.
     */
    setError(null);
    setValidationErrors({});
    setLoading(true);
    try {
      const payload = { email, password };
      if (packageTier) payload.package_tier = packageTier;
      const tokenRes = await api.signup(payload);
      persistToken(tokenRes?.access_token);
      const dash = await api.getDashboard();
      persistUser(dash?.user || null);
      return { ok: true };
    } catch (e) {
      // Parse field-specific validation errors (e.g., 422 from FastAPI)
      const parsed = parseValidationErrors(e);
      // Expose field errors to UI
      setValidationErrors(parsed.fieldErrors || {});
      // Keep a human-friendly top-level message for generic displays
      const friendly = parsed.nonFieldErrors?.length
        ? parsed.nonFieldErrors.join("; ")
        : extractErrorMessage(e, "Signup failed");
      setError(friendly);
      persistToken(null);
      persistUser(null);
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [persistToken, persistUser]);

  const doLogout = useCallback(() => {
    /**
     * PUBLIC_INTERFACE
     * Clear token and user profile.
     */
    persistToken(null);
    persistUser(null);
    setError(null);
    setValidationErrors({});
  }, [persistToken, persistUser]);

  const refreshProfile = useCallback(async () => {
    /**
     * PUBLIC_INTERFACE
     * Refresh the user profile from the dashboard endpoint.
     */
    if (!token) return null;
    try {
      setLoading(true);
      const dash = await api.getDashboard();
      persistUser(dash?.user || null);
      return dash?.user || null;
    } catch (e) {
      setError(e?.response?.data || e?.message || "Failed to refresh profile");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, persistUser]);

  const doUpdatePlan = useCallback(async (packageTier) => {
    /**
     * PUBLIC_INTERFACE
     * Update user's plan/package and sync local profile state.
     */
    if (!token) {
      setError("Unauthorized");
      return { ok: false, error: "Unauthorized" };
    }
    setError(null);
    setValidationErrors({});
    setLoading(true);
    try {
      const updated = await api.updatePlan(packageTier);
      // Immediately mirror into user object for responsive UI
      const nextUser = user ? { ...user, package_tier: updated?.package_tier } : user;
      persistUser(nextUser);
      return { ok: true, plan: updated };
    } catch (e) {
      setError(e?.response?.data || e?.message || "Failed to update plan");
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [token, user, persistUser]);

  // PUBLIC_INTERFACE
  const clearAuthError = useCallback(() => {
    /** Clear any stored auth error and validation errors (e.g., when switching modes or closing modals). */
    setError(null);
    setValidationErrors({});
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    error,
    validationErrors,
    isAuthenticated: !!token,
    login: doLogin,
    signup: doSignup,
    logout: doLogout,
    refreshProfile,
    updatePlan: doUpdatePlan,
    clearAuthError,
  }), [token, user, loading, error, validationErrors, doLogin, doSignup, doLogout, refreshProfile, doUpdatePlan, clearAuthError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Access authentication state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
