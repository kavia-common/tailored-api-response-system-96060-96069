import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboard, getTailoredContent } from "../services/api";

// PUBLIC_INTERFACE
export default function Dashboard({ onRequestLogin }) {
  /** Dashboard shows profile and features enabled by package plus tailored content. */
  const { isAuthenticated, user } = useAuth();
  const [features, setFeatures] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        setErr(null);
        const dash = await getDashboard();
        setFeatures(dash?.features || []);
        const c = await getTailoredContent();
        setContent(c || null);
      } catch (e) {
        setErr(e?.response?.data || e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="hero">
          <h1>Welcome to tataelxsi mock api</h1>
          <p className="muted">Sign in to see content tailored to your subscription package.</p>
          <div className="actions">
            <button className="btn btn-large" onClick={onRequestLogin}>Login / Sign up</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <h3>Your Package</h3>
            <span className={`badge tier-${user?.package_tier}`}>{user?.package_tier}</span>
          </div>
          <div className="card-content">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Features</h3></div>
          <div className="card-content">
            {loading ? <div className="skeleton lines-4" /> : (
              <ul className="feature-list">
                {features.map((f) => (
                  <li key={f.key} className={f.enabled ? "enabled" : "disabled"}>
                    <span className="feat-label">{f.label}</span>
                    <span className="feat-status">{f.enabled ? "Enabled" : "Disabled"}</span>
                    {typeof f.limit === "number" ? <span className="feat-limit">Limit: {f.limit}</span> : null}
                  </li>
                ))}
                {!features?.length && <li className="muted">No features available</li>}
              </ul>
            )}
          </div>
        </div>

        <div className="card full">
          <div className="card-header"><h3>Tailored Content</h3></div>
          <div className="card-content">
            {err && <div className="form-error">{String(err?.detail || err?.msg || err)}</div>}
            {loading ? <div className="skeleton lines-6" /> : (
              content ? (
                <pre className="code-block">{JSON.stringify(content, null, 2)}</pre>
              ) : (
                <p className="muted">No content yet. Try again later.</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
