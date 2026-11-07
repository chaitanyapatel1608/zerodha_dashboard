import React from "react";
import "./SipDeleteModal.css";

const SipDeleteModal = ({
  isOpen,
  sip,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !sip) return null;

  const totalRuns = sip.totalInstallmentsExecuted || 0;
  const totalInvested = Number(sip.totalCapitalInvested || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="sip-del-overlay" onClick={onClose}>
      <div className="sip-del-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sip-del-header">
          <div className="sip-del-title-row">
            <span className="sip-del-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </span>
            <div>
              <h3 className="sip-del-title">Cancel Stock SIP</h3>
              <span className="sip-del-subtitle">Permanent schedule cancellation</span>
            </div>
          </div>
          <button className="sip-del-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="sip-del-body">
          {/* Target Plan Details Card */}
          <div className="sip-del-plan-card">
            <div className="sip-del-plan-header">
              <span className="sip-del-plan-name">{sip.name}</span>
              <div className="sip-del-tags">
                <span className="sip-del-ticker-badge">
                  {sip.symbol || sip.basketName || "DIRECT"}
                </span>
                <span className="sip-del-type-badge">
                  {sip.sipType || (sip.basketName ? "Basket SIP" : "Direct Stock SIP")}
                </span>
              </div>
            </div>

            <div className="sip-del-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Schedule</span>
                <span className="meta-value">
                  {sip.frequency === "MONTHLY"
                    ? `Monthly on Day ${sip.scheduleDay}`
                    : sip.frequency === "WEEKLY"
                    ? `Weekly on Day ${sip.scheduleDay}`
                    : "Daily (Trading Days)"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total Invested</span>
                <span className="meta-value">₹{totalInvested}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Runs Executed</span>
                <span className="meta-value">{totalRuns} installment{totalRuns === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>

          {/* Caution Alert Box */}
          <div className="sip-del-warning-box">
            <div className="warning-item">
              <span className="warning-icon danger">✕</span>
              <span><strong>Future orders halted:</strong> No further automatic buy orders will be placed for this SIP mandate.</span>
            </div>
            <div className="warning-item">
              <span className="warning-icon safe">✓</span>
              <span><strong>Existing holdings safe:</strong> All shares and units already bought remain securely in your Demat portfolio.</span>
            </div>
          </div>

          <p className="sip-del-confirm-text">
            Are you sure you want to cancel <strong>{sip.name}</strong>? This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="sip-del-footer">
          <button
            type="button"
            className="btn-del-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Keep SIP Active
          </button>
          <button
            type="button"
            className="btn-del-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="del-spinner"></span>
                <span>Cancelling SIP...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Yes, Cancel SIP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SipDeleteModal;
