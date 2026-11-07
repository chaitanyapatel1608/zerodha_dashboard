import React from "react";
import "./BasketExecuteModal.css";

const BasketExecuteModal = ({
  isOpen,
  basket,
  onClose,
  onConfirm,
  isExecuting = false,
  availableMargin = 124500,
}) => {
  if (!isOpen || !basket) return null;

  const items = Array.isArray(basket.items) ? basket.items : [];

  // Calculate required margin
  let calculatedMargin = 0;
  items.forEach((item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const cost = qty * price;
    const margin = (item.product || "CNC") === "MIS" ? cost * 0.2 : cost;
    if ((item.mode || item.type || "BUY").toUpperCase() === "BUY") {
      calculatedMargin += margin;
    }
  });

  const totalRequired = calculatedMargin > 0 ? calculatedMargin : Number(basket.marginRequired || 0);

  const numAvailable =
    typeof availableMargin === "number"
      ? availableMargin
      : parseFloat(availableMargin.toString().replace(/,/g, "")) || 124500;

  const hasAdequateMargin = numAvailable >= totalRequired;

  return (
    <div className="basket-exec-overlay" onClick={onClose}>
      <div className="basket-exec-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="basket-exec-header">
          <div className="basket-exec-title-row">
            <span className="basket-exec-icon-badge">⚡</span>
            <div>
              <h3 className="basket-exec-title">Execute Order Basket</h3>
              <span className="basket-exec-subtitle">
                Pre-trade margin verification & multi-leg execution review (NSE)
              </span>
            </div>
          </div>
          <button className="basket-exec-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="basket-exec-body">
          {/* Basket Overview Card */}
          <div className="basket-exec-card">
            <div className="basket-exec-card-top">
              <span className="basket-exec-name">{basket.name}</span>
              <div className="basket-exec-badges">
                <span className="badge-legs-count">{items.length} Order Legs</span>
                <span className="badge-exchange-tag">NSE / BSE</span>
              </div>
            </div>
            <div className="basket-exec-card-meta">
              <span>Strategy Type: </span>
              <strong>Multi-Constituent Basket</strong>
              <span className="meta-dot">•</span>
              <span>Execution Mode: </span>
              <strong>Concurrent Exchange Dispatch</strong>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="basket-exec-financial-box">
            <div className="financial-col">
              <span className="fin-label">Total Required Margin</span>
              <span className="fin-value primary">
                ₹{Number(totalRequired).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="fin-hint">Factorized for CNC delivery & MIS leverage</span>
            </div>
            <div className="financial-col">
              <span className="fin-label">Available Demat Cash</span>
              <span className={`fin-value ${hasAdequateMargin ? "text-green" : "text-red"}`}>
                ₹{Number(numAvailable).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`margin-status-pill ${hasAdequateMargin ? "adequate" : "inadequate"}`}>
                {hasAdequateMargin ? "✓ Margin Adequate" : "⚠ Margin Insufficient"}
              </span>
            </div>
          </div>

          {/* Warning banner if insufficient funds */}
          {!hasAdequateMargin && (
            <div className="basket-exec-warning-banner">
              <strong>Insufficient Available Cash Margin!</strong>
              <p>
                You require ₹{(totalRequired - numAvailable).toLocaleString("en-IN", { minimumFractionDigits: 2 })} additional capital in your Demat account to place these {items.length} orders.
              </p>
            </div>
          )}

          {/* Constituent Order Legs Table */}
          <div className="basket-exec-table-wrap">
            <div className="basket-exec-table-header">
              <span>Constituent Orders ({items.length})</span>
              <span className="table-subtitle">All orders will execute concurrently</span>
            </div>

            <div className="basket-exec-table-scroll">
              <table className="basket-exec-table">
                <thead>
                  <tr>
                    <th>Side</th>
                    <th>Instrument</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>LTP / Price</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const sym = it.symbol || it.name;
                    const mode = (it.mode || it.type || "BUY").toUpperCase();
                    const qty = Number(it.qty || 1);
                    const price = Number(it.price || 0);
                    const val = qty * price;
                    return (
                      <tr key={idx}>
                        <td>
                          <span className={`exec-mode-pill ${mode === "BUY" ? "buy" : "sell"}`}>
                            {mode}
                          </span>
                        </td>
                        <td>
                          <strong className="exec-sym-text">{sym}</strong>
                          <span className="exec-exch-sub">NSE</span>
                        </td>
                        <td>
                          <span className="exec-prod-tag">{it.product || "CNC"}</span>
                        </td>
                        <td>
                          <span className="exec-qty-num">{qty}</span>
                        </td>
                        <td>
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <strong>₹{val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notice Card */}
          <div className="basket-exec-notice-card">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              Orders will execute immediately at current market prices. Trade confirmation emails and in-app notifications will be generated instantly, and your portfolio holdings will update.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="basket-exec-footer">
          <button type="button" className="btn-exec-cancel" onClick={onClose} disabled={isExecuting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-exec-confirm"
            disabled={isExecuting || !hasAdequateMargin || items.length === 0}
            onClick={() => onConfirm(basket)}
          >
            {isExecuting ? (
              <>
                <span className="exec-spinner"></span>
                <span>Executing {items.length} Orders...</span>
              </>
            ) : (
              <span>Execute {items.length} Orders Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasketExecuteModal;
