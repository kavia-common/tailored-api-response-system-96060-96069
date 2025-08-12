import React from "react";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export default function Profile({ onRequestLogin }) {
  /** Profile page displaying user and package details. */
  const { isAuthenticated, user } = useAuth();

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
          <div className="detail-row"><span className="label">Package</span><span className="value">{user?.package_tier}</span></div>
        </div>
      </div>
    </div>
  );
}
