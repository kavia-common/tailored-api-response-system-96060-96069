import React from "react";

// PUBLIC_INTERFACE
export default function Modal({ isOpen, onClose, title, children, footer }) {
  /**
   * Accessible modal dialog with overlay.
   * - isOpen: boolean to control visibility
   * - onClose: function to close the modal
   * - title: string displayed in header
   * - children: modal body content
   * - footer: optional footer node for actions
   */
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
