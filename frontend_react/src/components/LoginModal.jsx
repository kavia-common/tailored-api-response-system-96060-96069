import React, { useState, useMemo } from "react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../utils/error";

// PUBLIC_INTERFACE
export default function LoginModal({ isOpen, onClose }) {
  /**
   * Modal dialog for user login and signup with package selection.
   * Adds frontend email validation: must contain "@" and end with "@tata.co.in".
   */
  const { login, signup, loading, error } = useAuth();
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

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setPackageTier("free");
    setLocalError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

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
      // handled by context error
    }
  };

  const footer = (
    <div className="modal-actions">
      <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
      <button
        className="btn"
        onClick={onSubmit}
        disabled={loading || !emailIsValid || !password}
      >
        {loading ? "Please wait..." : (mode === "login" ? "Login" : "Create account")}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "login" ? "Welcome back" : "Create your account"} footer={footer}>
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
        </div>
        {mode === "signup" && (
          <div className="form-row">
            <label htmlFor="tier">Package tier</label>
            <select id="tier" value={packageTier} onChange={(e) => setPackageTier(e.target.value)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        )}
        {(localError || error) && <div className="form-error">{extractErrorMessage(localError || error)}</div>}
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
