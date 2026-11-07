import React, { useState } from "react";
import axios from "axios";
import "./SquareOffAllModal.css";

const API_BASE = "http://localhost:3002";

const SquareOffAllModal = ({ isOpen, onClose, openPositions = [], quotes = {}, currentUser, onSquareOffSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  let estimatedRealizedPnl = 0;
  openPositions.forEach((pos) => {
    const sym = pos.instrument || pos.name;
    const live = quotes[sym];
    const ltp = live ? live.price : (pos.ltp || pos.price || pos.avg || 0);
    const avg = pos.avg || ltp;
    const qty = pos.qty || 0;
    if (qty > 0) {
      estimatedRealizedPnl += (ltp - avg) * qty;
    } else {
      estimatedRealizedPnl += (avg - ltp) * Math.abs(qty);
    }
  });

  const handleConfirmSquareOff = async () => {
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/squareOffAllPositions`, {
        userId: currentUser?.userId,
      });

      if (res.data && res.data.success) {
        if (onSquareOffSuccess) onSquareOffSuccess(res.data.message);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to square off positions.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to execute square off orders.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sq-modal-backdrop" onClick={onClose}>
      <div className="sq-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sq-modal-header">
          <div className="sq-header-box">
            <span className="sq-badge">EMERGENCY RISK CONTROL</span>
            <h3 className="sq-title">Square Off All Open Positions ({openPositions.length})</h3>
          </div>
          <button className="sq-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="sq-modal-body">
          {errorMsg && <div className="sq-alert error">{errorMsg}</div>}

          <div className="sq-warning-strip">
            <span className="sq-warning-icon">⚠️</span>
            <div className="sq-warning-text">
              <strong>Caution:</strong> This action will instantly dispatch market orders to close all <strong>{openPositions.length}</strong> open intraday and F&O positions. Blocked margins will be released immediately to your cash balance.
            </div>
          </div>

          {/* Positions List to Square Off */}
          <div className="sq-positions-list">
            <div className="sq-list-header">
              <span>Instrument</span>
              <span>Product</span>
              <span>Open Qty</span>
              <span>Current LTP</span>
            </div>
            {openPositions.map((pos, idx) => {
              const sym = pos.instrument || pos.name;
              const live = quotes[sym];
              const ltp = live ? live.price : (pos.ltp || pos.price || pos.avg || 0);

              return (
                <div key={pos._id || idx} className="sq-list-row">
                  <span className="sq-sym">{sym}</span>
                  <span className="sq-prod">{pos.product || "MIS"}</span>
                  <span className={pos.qty > 0 ? "text-green" : "text-amber"}>
                    {pos.qty > 0 ? `+${pos.qty}` : pos.qty}
                  </span>
                  <span className="sq-ltp">₹{ltp.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Est P&L Summary */}
          <div className="sq-est-summary">
            <span className="est-label">Estimated Day P&L Impact:</span>
            <span className={`est-val ${estimatedRealizedPnl >= 0 ? "text-green" : "text-red"}`}>
              {estimatedRealizedPnl >= 0 ? "+" : ""}₹{estimatedRealizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="sq-modal-footer">
          <button className="btn-kite-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-sq-danger"
            onClick={handleConfirmSquareOff}
            disabled={isSubmitting || openPositions.length === 0}
          >
            {isSubmitting ? "Executing Market Exits..." : `Yes, Square Off All (${openPositions.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SquareOffAllModal;
