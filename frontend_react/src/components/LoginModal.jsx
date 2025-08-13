import React, { useMemo, useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage, parseValidationErrors } from "../utils/error";

// PUBLIC_INTERFACE
export default function LoginModal({ isOpen, onClose }) {
  /**
   * Modal dialog for user login and signup with package selection.
   * Adds frontend email validation: must contain "@" and end with "@tata.co.in".
   * Enhances error display by parsing FastAPI 422 validation errors and mapping
   * them to specific form fields for actionable feedback.
   */
  const { login, signup, loading, error, validationErrors, clearAuthError } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packageTier, setPackageTier] = useState("free");
  const [localError, setLocalError] = useState(null);

  // Validate email to contain '@' and end with '@tata.co.in'
  const validateEmailDomain = (val) => {
    const e = String(val || "").trim().toLowerCase();
    return e.includes("@") && e.endsWith("@tata.co.in");
  };

  const emailIsValid = useMemo(() => validateEmailDomain(email), [email]);
  const emailInlineError =
    email && !emailIsValid
      ? 'Email must contain "@" and end with "@tata.co.in".'
      : null;

  // Parse server errors into field/non-field buckets
  const parsedFromError = useMemo(() => parseValidationErrors(error), [error]);
  const fieldErrors = useMemo(() => {
    // Prefer context-provided validationErrors (set during signup), else parse from error
    if (validationErrors && Object.keys(validationErrors || {}).length > 0) return validationErrors;
    return parsedFromError.fieldErrors || {};
  }, [validationErrors, parsedFromError]);
  const nonFieldErrorsText = useMemo(() => {
    const items = parsedFromError?.nonFieldErrors || [];
    return items.length ? items.join("; ") : null;
  }, [parsedFromError]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setPackageTier("free");
    setLocalError(null);
    clearAuthError?.();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError?.();

    if (!email || !password) {
      setLocalError("Please enter email and password.");
      return;
    }

    // Enforce email validation before calling APIs
    if (!emailIsValid) {
      setLocalError('Email must contain "@" and end with "@tata.co.in".');
      return;
    }

    const action = mode === "login" ? login(email, password) : signup(email, password, packageTier);
    const res = await action;
    if (res.ok) {
      resetForm();
      onClose();
    } else if (res.error) {
      // Context error/validationErrors will display
    }
  };

  const renderFieldErrors = (name) => {
    const arr = fieldErrors?.[name];
    if (!arr || !arr.length) return null;
    return arr.map((msg, idx) => (
      <div key={`${name}-err-${idx}`} className="form-error">{msg}</div>
    ));
  };

  const onCancel = () => {
    clearAuthError?.();
    onClose();
  };

  const footer = (
    <div className="modal-actions">
      <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
      <button
        className="btn"
        onClick={onSubmit}
        disabled={loading || !emailIsValid || !password}
      >
        {loading ? "Please wait..." : (mode === "login" ? "Login" : "Create account")}
      </button>
    </div>
  );

  const topLevelErrorText = useMemo(() => {
    // Prefer local error; else use non-field server validation; else fallback to generic extracted message
    return localError || nonFieldErrorsText || (error ? extractErrorMessage(error) : null);
  }, [localError, nonFieldErrorsText, error]);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={mode === "login" ? "Welcome back" : "Create your account"} footer={footer}>
      <form onSubmit={onSubmit} className="form">
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@tata.co.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailInlineError && <div className="form-error">{emailInlineError}</div>}
          {!emailInlineError && renderFieldErrors("email")}
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
          {renderFieldErrors("password")}
        </div>
        {mode === "signup" && (
          <div className="form-row">
            <label htmlFor="tier">Package tier</label>
            <select id="tier" value={packageTier} onChange={(e) => setPackageTier(e.target.value)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            {renderFieldErrors("package_tier")}
          </div>
        )}
        {topLevelErrorText && <div className="form-error">{topLevelErrorText}</div>}
        <div className="form-hint">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode("signup");
                  setLocalError(null);
                  clearAuthError?.();
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode("login");
                  setLocalError(null);
                  clearAuthError?.();
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
