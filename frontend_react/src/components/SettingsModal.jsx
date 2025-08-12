import React from "react";
import Modal from "./Modal";

// PUBLIC_INTERFACE
export default function SettingsModal({ isOpen, onClose, theme, onChangeTheme }) {
  /** Modal dialog for application settings like theme. */
  const footer = (
    <div className="modal-actions">
      <button className="btn btn" onClick={onClose}>Close</button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" footer={footer}>
      <div className="form">
        <div className="form-row">
          <label>Theme</label>
          <div className="segmented">
            <button className={`segmented-item ${theme === "light" ? "active" : ""}`} onClick={() => onChangeTheme("light")}>Light</button>
            <button className={`segmented-item ${theme === "dark" ? "active" : ""}`} onClick={() => onChangeTheme("dark")}>Dark</button>
          </div>
          <div className="form-hint">Theme colors: Primary #1976d2, Accent #ff9800, Secondary #424242.</div>
        </div>
      </div>
    </Modal>
  );
}
