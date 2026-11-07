import React, { useState } from "react";
import axios from "axios";
import "./GSecBidModal.css";

const API_BASE = "http://localhost:3002";

const GSecBidModal = ({ gsec, onClose, onBidSuccess, currentUser, showToast, refreshPortfolio }) => {
  const [units, setUnits] = useState(gsec?.minQty || 10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!gsec) return null;

  const pricePerUnit = gsec.pricePerUnit || 1000;
  const totalAmount = units * pricePerUnit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (units < (gsec.minQty || 1)) {
      setErrorMsg(`Minimum order quantity for this security is ${gsec.minQty} units.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/applyGsecBid`, {
        userId: currentUser?.userId,
        symbol: gsec.symbol,
        instrumentName: gsec.name,
        category: gsec.category,
        units,
        pricePerUnit,
        indicativeYield: gsec.yield,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "RBI G-Sec Bid Placed",
            `Non-competitive bid for ${units} units of ${gsec.name} submitted successfully!`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onBidSuccess) onBidSuccess(res.data.bid);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to place G-Sec bid.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Error submitting non-competitive bid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gsec-modal-overlay" onClick={onClose}>
      <div className="gsec-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="gsec-modal-header">
          <div>
            <span className="gsec-badge">RBI NON-COMPETITIVE BIDDING</span>
            <h3 className="gsec-title">{gsec.name}</h3>
            <span className="gsec-sub">Symbol: {gsec.symbol} &bull; Category: {gsec.category}</span>
          </div>
          <button className="gsec-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="gsec-modal-body">
          {errorMsg && <div className="gsec-alert error">{errorMsg}</div>}

          {/* Key Specs */}
          <div className="gsec-specs-grid">
            <div className="gsec-spec-card">
              <span className="spec-label">Indicative Yield</span>
              <span className="spec-val text-green">{gsec.yield}</span>
            </div>
            <div className="gsec-spec-card">
              <span className="spec-label">Price per Unit</span>
              <span className="spec-val">₹{pricePerUnit.toFixed(2)}</span>
            </div>
            <div className="gsec-spec-card">
              <span className="spec-label">Maturity / Tenure</span>
              <span className="spec-val">{gsec.maturityDate}</span>
            </div>
            <div className="gsec-spec-card">
              <span className="spec-label">Settlement</span>
              <span className="spec-val">{gsec.settlementDate}</span>
            </div>
          </div>

          {/* Unit selection */}
          <div className="gsec-field-group">
            <label className="gsec-label">Bid Units (Min. {gsec.minQty} units)</label>
            <div className="gsec-units-counter">
              <button
                type="button"
                className="btn-counter-adj"
                onClick={() => setUnits((prev) => Math.max(gsec.minQty || 1, prev - 10))}
              >
                -10
              </button>
              <input
                type="number"
                className="units-input"
                value={units}
                min={gsec.minQty || 1}
                step="1"
                onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                type="button"
                className="btn-counter-adj"
                onClick={() => setUnits((prev) => prev + 10)}
              >
                +10
              </button>
            </div>
          </div>

          {/* Total calculation */}
          <div className="gsec-total-box">
            <div className="total-row">
              <span>Total Payable Amount:</span>
              <strong className="total-amount">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
            <p className="gsec-note">
              Funds will be debited from your trading account and submitted to the Reserve Bank of India (RBI) auction clearing on settlement date.
            </p>
          </div>

          <div className="gsec-modal-actions">
            <button type="button" className="btn-kite-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-kite-primary" disabled={isSubmitting}>
              {isSubmitting ? "Placing Bid..." : "Submit Non-Competitive Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GSecBidModal;
