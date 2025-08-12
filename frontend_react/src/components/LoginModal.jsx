import React, { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export default function LoginModal({ isOpen, onClose }) {
  /** Modal dialog for user login and signup with package selection. */
  const { login, signup, loading, error } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packageTier, setPackageTier] = useState("free");
  const [localError, setLocalError] = useState(null);

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
      <button className="btn" onClick={onSubmit} disabled={loading}>{loading ? "Please wait..." : (mode === "login" ? "Login" : "Create account")}</button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "login" ? "Welcome back" : "Create your account"} footer={footer}>
      <form onSubmit={onSubmit} className="form">
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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
        {(localError || error) && <div className="form-error">{String(localError || (error?.detail || error?.msg || error))}</div>}
        <div className="form-hint">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("signup")}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("login")}>
                Log in
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
