import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export default function Profile({ onRequestLogin }) {
  /** Profile page displaying user and package details with plan management. */
  const { isAuthenticated, user, updatePlan, loading, error } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(user?.package_tier || "free");
  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);
  const canSubmit = useMemo(
    () => isAuthenticated && selectedPlan && selectedPlan !== user?.package_tier,
    [isAuthenticated, selectedPlan, user?.package_tier]
  );

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-header"><h3>Profile</h3></div>
          <div className="card-content">
            <p className="muted">You are not logged in.</p>
            <button className="btn" onClick={onRequestLogin}>Login / Sign up</button>
          </div>
        </div>
      </div>
    );
  }

  const onUpdate = async () => {
    setLocalError(null);
    setSuccess(null);
    try {
      const res = await updatePlan(selectedPlan);
      if (res.ok) {
        setSuccess(`Plan updated to "${res.plan?.package_tier}"`);
      } else {
        setLocalError(res.error || "Failed to update plan");
      }
    } catch (e) {
      setLocalError(e?.response?.data || e?.message || "Failed to update plan");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h3>Profile</h3>
          <span className={`badge tier-${user?.package_tier}`}>{user?.package_tier}</span>
        </div>
        <div className="card-content">
          <div className="detail-row"><span className="label">User ID</span><span className="value">{user?.id}</span></div>
          <div className="detail-row"><span className="label">Email</span><span className="value">{user?.email}</span></div>
          <div className="detail-row"><span className="label">Current Package</span><span className="value">{user?.package_tier}</span></div>

          <div className="code-section">
            <p className="muted" style={{ marginTop: 0 }}>Change your subscription package</p>
            <div className="form" style={{ maxWidth: 360 }}>
              <div className="form-row">
                <label htmlFor="plan">Select Plan</label>
                <select
                  id="plan"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {(localError || error) && (
                <div className="form-error">{String(localError || (error?.detail || error?.msg || error))}</div>
              )}
              {success && (
                <div className="badge" style={{ borderColor: "#16a34a", color: "#16a34a" }}>{success}</div>
              )}
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn" disabled={!canSubmit || loading} onClick={onUpdate}>
                  {loading ? "Updating..." : "Update Plan"}
                </button>
              </div>
              <div className="form-hint">Changing your plan will immediately affect your available features and API responses.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
