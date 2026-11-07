import React from "react";
import "./SipExecuteModal.css";

const SipExecuteModal = ({
  isOpen,
  sip,
  onClose,
  onConfirm,
  isExecuting = false,
  availableMargin = 124500,
}) => {
  if (!isOpen || !sip) return null;

  // Calculate estimated installment amount
  const legsTotal =
    sip.instruments && sip.instruments.length > 0
      ? sip.instruments.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
      : 0;

  const estimatedAmount = legsTotal > 0 ? legsTotal : (sip.minAmount || 0);

  const numAvailable = typeof availableMargin === "number"
    ? availableMargin
    : parseFloat(availableMargin.toString().replace(/,/g, "")) || 124500;

  const hasAdequateMargin = numAvailable >= estimatedAmount;

  const isAlreadyExecutedToday = Boolean(
    sip.lastExecutedAt &&
    new Date(sip.lastExecutedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="sip-exec-overlay" onClick={onClose}>
      <div className="sip-exec-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sip-exec-header">
          <div className="sip-exec-title-row">
            <span className="sip-exec-icon-badge">⚡</span>
            <div>
              <h3 className="sip-exec-title">Execute SIP Installment</h3>
              <span className="sip-exec-subtitle">Immediate manual order execution simulation</span>
            </div>
          </div>
          <button className="sip-exec-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="sip-exec-body">
          {/* Plan Info Card */}
          <div className="sip-exec-plan-card">
            <div className="sip-exec-plan-header">
              <span className="sip-exec-plan-name">{sip.name}</span>
              <div className="sip-exec-tags">
                <span className="sip-exec-ticker-badge">
                  {sip.symbol || sip.basketName || "DIRECT"}
                </span>
                <span className="sip-exec-type-badge">
                  {sip.sipType || (sip.basketName ? "Basket SIP" : "Direct Stock SIP")}
                </span>
              </div>
            </div>
            <div className="sip-exec-schedule-info">
              <span>Schedule: </span>
              <strong>
                {sip.frequency === "MONTHLY"
                  ? `Monthly on Day ${sip.scheduleDay}`
                  : sip.frequency === "WEEKLY"
                  ? `Weekly on Day ${sip.scheduleDay}`
                  : "Daily (Trading Days)"}
              </strong>
              <span style={{ margin: "0 6px" }}>•</span>
              <span>Next scheduled trigger: </span>
              <strong>
                {new Date(sip.nextTriggerAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
          </div>

          {isAlreadyExecutedToday && (
            <div className="sip-exec-advance-notice">
              <span className="advance-tag">⚡ ADVANCE INSTALLMENT PRE-PAYMENT</span>
              <span>
                Today&apos;s scheduled run has already been executed. Confirming now will immediately place and pre-fund your upcoming installment scheduled for <strong>{new Date(sip.nextTriggerAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>.
              </span>
            </div>
          )}

          {/* Financial Breakdown Grid */}
          <div className="sip-exec-financial-box">
            <div className="financial-col">
              <span className="fin-label">Estimated Order Value</span>
              <span className="fin-value primary">
                ₹{Number(estimatedAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="fin-sub">CNC Market Order</span>
            </div>
            <div className="fin-divider"></div>
            <div className="financial-col">
              <span className="fin-label">Available Cash Margin</span>
              <span className={`fin-value ${hasAdequateMargin ? "success" : "danger"}`}>
                ₹{Number(numAvailable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className={`fin-status-pill ${hasAdequateMargin ? "adequate" : "shortfall"}`}>
                {hasAdequateMargin ? "✓ Margin Adequate" : "⚠️ Margin Shortfall"}
              </span>
            </div>
          </div>

          {/* Underlying Legs / Instruments */}
          {((sip.instruments && sip.instruments.length > 0) || sip.symbol || sip.basketName) && (
            <div className="sip-exec-legs-section">
              <span className="legs-label">Orders Being Executed (NSE CNC Market):</span>
              <div className="legs-list">
                {sip.instruments && sip.instruments.length > 0 ? (
                  sip.instruments.map((inst, idx) => (
                    <div key={idx} className="leg-item">
                      <span className="leg-action">BUY</span>
                      <strong className="leg-qty">{inst.qty || 1} qty</strong>
                      <span className="leg-sym">{inst.symbol}</span>
                      <span className="leg-price">
                        @ ₹{Number(inst.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="leg-item">
                    <span className="leg-action">BUY</span>
                    <strong className="leg-qty">1 qty</strong>
                    <span className="leg-sym">{sip.symbol || sip.basketName || sip.name}</span>
                    <span className="leg-price">
                      @ ₹{Number(estimatedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="sip-exec-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              Orders will execute immediately at current market prices. Trade confirmation emails and in-app notifications will be sent instantly, and your portfolio holdings will update.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sip-exec-footer">
          <button type="button" className="btn-exec-cancel" onClick={onClose} disabled={isExecuting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-exec-confirm"
            onClick={onConfirm}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <span className="spinner-dot"></span>
                <span>Executing Order...</span>
              </>
            ) : (
              <>
                <span>Confirm & Execute Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SipExecuteModal;
