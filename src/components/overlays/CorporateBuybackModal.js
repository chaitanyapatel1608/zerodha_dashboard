import React, { useState } from "react";
import axios from "axios";
import "./CorporateBuybackModal.css";

const API_BASE = "http://localhost:3002";

const CorporateBuybackModal = ({ action, onClose, onTenderSuccess, currentUser, holdings = [], showToast, refreshPortfolio }) => {
  // Find user Demat holding for this symbol
  const userHolding = (holdings || []).find(
    (h) => (h.instrument || h.name || "").toUpperCase() === (action?.symbol || "").toUpperCase()
  );
  const ownedQty = userHolding ? Number(userHolding.qty || 0) : 0;

  const [tenderQty, setTenderQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!action) return null;

  const tenderPrice = action.tenderPrice || 100;
  const currentPrice = action.currentMarketPrice || tenderPrice;
  const totalAmount = tenderQty * tenderPrice;
  const premiumGain = (tenderPrice - currentPrice) * tenderQty;

  const handleTenderSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (ownedQty === 0) {
      setErrorMsg(`You do not hold any shares of ${action.symbol} in your Demat account.`);
      return;
    }

    if (tenderQty > ownedQty) {
      setErrorMsg(`Cannot tender more than your Demat balance (${ownedQty} shares).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/tenderCorporateAction`, {
        userId: currentUser?.userId,
        symbol: action.symbol,
        companyName: action.companyName,
        tenderedQty: tenderQty,
        tenderPrice,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Buyback Tender Submitted",
            `Successfully tendered ${tenderQty} shares of ${action.companyName} at ₹${tenderPrice}!`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onTenderSuccess) onTenderSuccess(res.data.tender);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to submit tender.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit tender.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="corp-modal-overlay" onClick={onClose}>
      <div className="corp-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="corp-modal-header">
          <div>
            <span className="corp-badge">SHARE BUYBACK & TENDER DESK</span>
            <h3 className="corp-title">{action.companyName}</h3>
            <span className="corp-sub">Symbol: {action.symbol} &bull; Type: Proportionate Tender Offer</span>
          </div>
          <button className="corp-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleTenderSubmit} className="corp-modal-body">
          {errorMsg && <div className="corp-alert error">{errorMsg}</div>}

          {/* Holdings verification strip */}
          <div className="corp-demat-status-box">
            <div className="demat-status-row">
              <span className="demat-status-label">Your Demat Holdings:</span>
              <strong className={`demat-status-val ${ownedQty > 0 ? "text-green" : "text-amber"}`}>
                {ownedQty} Shares available
              </strong>
            </div>
            {ownedQty === 0 && (
              <span className="demat-status-warning">
                ⚠️ You must hold settled shares of {action.symbol} in your Demat account to participate.
              </span>
            )}
          </div>

          {/* Pricing & Premium Grid */}
          <div className="corp-pricing-grid">
            <div className="corp-price-card">
              <span className="p-label">Buyback Offer Price</span>
              <span className="p-val font-bold text-green">₹{tenderPrice.toFixed(2)}</span>
            </div>
            <div className="corp-price-card">
              <span className="p-label">Current Market Price</span>
              <span className="p-val">₹{currentPrice.toFixed(2)}</span>
            </div>
            <div className="corp-price-card">
              <span className="p-label">Buyback Premium</span>
              <span className="p-val text-blue">{action.premiumPercent}</span>
            </div>
            <div className="corp-price-card">
              <span className="p-label">Total Issue Size</span>
              <span className="p-val">{action.issueSize}</span>
            </div>
          </div>

          {/* Tender Qty Input */}
          <div className="corp-field-group">
            <label className="corp-label">Quantity to Tender (Max: {ownedQty} shares)</label>
            <div className="tender-qty-row">
              <input
                type="number"
                className="corp-input"
                min="1"
                max={Math.max(1, ownedQty)}
                value={tenderQty}
                onChange={(e) => setTenderQty(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={ownedQty === 0}
                required
              />
              {ownedQty > 0 && (
                <button
                  type="button"
                  className="btn-tender-all"
                  onClick={() => setTenderQty(ownedQty)}
                >
                  Tender All ({ownedQty})
                </button>
              )}
            </div>
          </div>

          {/* Financial Calculation Summary */}
          <div className="corp-total-card">
            <div className="corp-total-row">
              <span>Total Tender Consideration:</span>
              <strong className="text-large text-green">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
            {premiumGain > 0 && (
              <div className="corp-total-row sub-row">
                <span>Estimated Premium Gain over Market Price:</span>
                <span className="text-green">+₹{premiumGain.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <p className="corp-disclaimer">
              Tendered shares will be earmarked and transferred to the clearing corporation during the settlement period. Unaccepted shares (if any due to over-subscription entitlement ratio) will be returned to your Demat account.
            </p>
          </div>

          <div className="corp-modal-actions">
            <button type="button" className="btn-kite-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-kite-primary"
              disabled={isSubmitting || ownedQty === 0}
            >
              {isSubmitting ? "Submitting Tender..." : "Tender Shares for Buyback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorporateBuybackModal;
