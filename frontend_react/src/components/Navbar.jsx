import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export default function Navbar({ onOpenLogin, onOpenSettings }) {
  /** Top navigation bar with routes and auth controls. */
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand">
          TATA ELXSI <span className="brand-accent">MOCK API</span>
        </Link>
        <NavLink to="/" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")} end>Dashboard</NavLink>
        <NavLink to="/profile" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>Profile</NavLink>
        <NavLink to="/api" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>API Explorer</NavLink>
      </div>
      <div className="nav-right">
        <button className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>⚙️</button>
        {isAuthenticated ? (
          <>
            <span className="nav-user">Hi, {user?.email}</span>
            <button className="btn btn-secondary" onClick={logout}>Logout</button>
          </>
        ) : (
          <button className="btn" onClick={onOpenLogin}>Login / Sign up</button>
        )}
      </div>
    </nav>
  );
}
