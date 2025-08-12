import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTailoredContent } from "../services/api";

// PUBLIC_INTERFACE
export default function ApiExplorer({ onRequestLogin }) {
  /** API Explorer to fetch and display tailored content with current token. */
  const { isAuthenticated, user } = useAuth();
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const callApi = async () => {
    setLoading(true);
    setErr(null);
    setResp(null);
    try {
      const data = await getTailoredContent();
      setResp(data);
    } catch (e) {
      setErr(e?.response?.data || e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h3>API Explorer</h3>
          {isAuthenticated && <span className={`badge tier-${user?.package_tier}`}>{user?.package_tier}</span>}
        </div>
        <div className="card-content">
          {!isAuthenticated ? (
            <>
              <p className="muted">You need to log in to call protected endpoints.</p>
              <button className="btn" onClick={onRequestLogin}>Login / Sign up</button>
            </>
          ) : (
            <>
              <p>Call the tailored content endpoint to see data based on your package.</p>
              <div className="actions">
                <button className="btn" disabled={loading} onClick={callApi}>{loading ? "Calling..." : "GET /api/content"}</button>
              </div>
              <div className="code-section">
                <p className="muted">Example curl</p>
                <pre className="code-block">
                  {`curl -H "Authorization: Bearer <your_token>" ${process.env.REACT_APP_BACKEND_URL || ""}/api/content`}
                </pre>
              </div>
              {err && <div className="form-error">{String(err?.detail || err?.msg || err)}</div>}
              {resp && (
                <>
                  <p className="muted">Response</p>
                  <pre className="code-block">{JSON.stringify(resp, null, 2)}</pre>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
