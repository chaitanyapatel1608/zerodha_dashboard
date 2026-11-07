import React from "react";
import "./AlertDeleteModal.css";

const AlertDeleteModal = ({
  isOpen,
  alert,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !alert) return null;

  return (
    <div className="alert-del-overlay" onClick={onClose}>
      <div className="alert-del-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="alert-del-header">
          <div className="alert-del-title-row">
            <span className="alert-del-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </span>
            <div>
              <h3 className="alert-del-title">Delete Price Alert</h3>
              <span className="alert-del-subtitle">Stop Sentinel price tracking</span>
            </div>
          </div>
          <button className="alert-del-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="alert-del-body">
          <div className="alert-del-card">
            <div className="alert-del-stock-row">
              <span className="stock-pill">{alert.symbol}</span>
              <span className="stock-exchange">NSE</span>
              <strong className="stock-name">{alert.name || alert.symbol}</strong>
            </div>

            <div className="alert-del-rule">
              <span className="rule-label">Target Rule:</span>
              <span className="rule-val">
                {alert.conditionType === "GTE"
                  ? `LTP ≥ ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`
                  : alert.conditionType === "LTE"
                  ? `LTP ≤ ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`
                  : alert.conditionType === "PCT_UP"
                  ? `Gain ≥ +${alert.targetPercentage}%`
                  : `Dip ≤ -${alert.targetPercentage}%`}
              </span>
            </div>
          </div>

          <p className="alert-del-text">
            Are you sure you want to permanently delete this price alert for <strong>{alert.symbol}</strong>? You will no longer receive in-app or email notifications for this price boundary.
          </p>
        </div>

        {/* Footer */}
        <div className="alert-del-footer">
          <button type="button" className="btn-del-cancel" onClick={onClose} disabled={isDeleting}>
            Keep Alert
          </button>
          <button type="button" className="btn-del-danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Yes, Delete Alert"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDeleteModal;
