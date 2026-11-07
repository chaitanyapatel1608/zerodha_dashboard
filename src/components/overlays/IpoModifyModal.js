import React, { useState } from "react";
import axios from "axios";
import "./IpoModifyModal.css";

const API_BASE = "http://localhost:3002";

const UPI_HANDLES = [
  "@okhdfcbank",
  "@okaxis",
  "@oksbi",
  "@okicici",
  "@paytm",
  "@ybl",
  "@ibl",
  "@upi",
];

const IpoModifyModal = ({ application, onClose, onModifiedSuccess, showToast, refreshPortfolio }) => {
  const [lots, setLots] = useState(application?.lots || 1);
  const [isCutOff, setIsCutOff] = useState(application?.isCutOff ?? true);
  const [bidPrice, setBidPrice] = useState(application?.bidPrice || 100);

  const initialUpi = (application?.upiId || "").split("@");
  const [upiUser, setUpiUser] = useState(initialUpi[0] || "");
  const [upiHandle, setUpiHandle] = useState(initialUpi[1] ? `@${initialUpi[1]}` : "@okhdfcbank");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!application) return null;

  const lotSize = application.lotSize || 1;
  const currentTotalAmount = application.totalAmount || 0;
  const newTotalQty = lots * lotSize;
  const effectivePrice = isCutOff ? (application.bidPrice || bidPrice) : parseFloat(bidPrice);
  const newTotalAmount = newTotalQty * effectivePrice;
  const lienDelta = newTotalAmount - currentTotalAmount;

  const fullUpiId = `${upiUser.trim()}${upiHandle}`;

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!upiUser.trim()) {
      setErrorMsg("Please enter your valid UPI ID username.");
      return;
    }

    if (application.investorCategory === "INDIVIDUAL" && newTotalAmount > 200000) {
      setErrorMsg("Retail investment cannot exceed ₹2,00,000 under SEBI regulations.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.put(`${API_BASE}/modifyIpoBid/${application._id}`, {
        lots,
        bidPrice: effectivePrice,
        isCutOff,
        upiId: fullUpiId,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "IPO Bid Modified",
            `Your bid for ${application.companyName} updated to ${lots} Lot(s). ASBA lien amended.`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onModifiedSuccess) onModifiedSuccess(res.data.application);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to update IPO bid.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to modify application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ipo-modify-overlay" onClick={onClose}>
      <div className="ipo-modify-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ipo-modify-header">
          <div>
            <span className="ipo-modify-badge">AMEND APPLICATION</span>
            <h3 className="ipo-modify-title">Modify Bid: {application.companyName}</h3>
            <span className="ipo-modify-sub">App #{application.applicationNumber} &bull; Symbol: {application.ipoSymbol}</span>
          </div>
          <button className="ipo-modify-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleModifySubmit} className="ipo-modify-body">
          {errorMsg && <div className="ipo-modify-alert error">{errorMsg}</div>}

          {/* Current vs New Lots */}
          <div className="modify-field-group">
            <label className="modify-label">Number of Lots (Lot Size: {lotSize} shares)</label>
            <div className="modify-lot-counter">
              <button
                type="button"
                className="btn-lot-adjust"
                onClick={() => setLots((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <div className="lot-display">
                <span className="lot-num">{lots}</span>
                <span className="lot-text">Lot{lots > 1 ? "s" : ""} ({newTotalQty} Shares)</span>
              </div>
              <button
                type="button"
                className="btn-lot-adjust"
                onClick={() => setLots((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Cut-off Price Checkbox */}
          <div className="modify-cutoff-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isCutOff}
                onChange={(e) => setIsCutOff(e.target.checked)}
              />
              <span className="checkbox-label">Cut-off price (Recommended by SEBI)</span>
            </label>
            <span className="cutoff-hint">Bids at highest issue price to ensure maximum allotment probability.</span>
          </div>

          {/* Price input if not cutoff */}
          {!isCutOff && (
            <div className="modify-field-group">
              <label className="modify-label">Custom Bid Price (₹)</label>
              <input
                type="number"
                className="modify-input"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                min="1"
                step="0.05"
                required
              />
            </div>
          )}

          {/* UPI ID */}
          <div className="modify-field-group">
            <label className="modify-label">UPI ID for Bank Lien Authorization</label>
            <div className="modify-upi-row">
              <input
                type="text"
                className="modify-input upi-name"
                value={upiUser}
                onChange={(e) => setUpiUser(e.target.value)}
                placeholder="e.g. mobile or username"
                required
              />
              <select
                className="modify-select upi-handle"
                value={upiHandle}
                onChange={(e) => setUpiHandle(e.target.value)}
              >
                {UPI_HANDLES.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Recalculation Summary */}
          <div className="modify-recalc-card">
            <div className="recalc-row">
              <span className="recalc-label">Current Blocked Lien:</span>
              <span className="recalc-val">₹{currentTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="recalc-row highlight">
              <span className="recalc-label">New Total ASBA Block:</span>
              <span className="recalc-val font-bold">₹{newTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="recalc-row border-top">
              <span className="recalc-label">Lien Difference:</span>
              <span className={`recalc-val ${lienDelta >= 0 ? "text-amber" : "text-green"}`}>
                {lienDelta >= 0 ? "+" : ""}₹{lienDelta.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="ipo-modify-actions">
            <button type="button" className="btn-kite-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-kite-primary" disabled={isSubmitting}>
              {isSubmitting ? "Amending Bid..." : "Submit Amended Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IpoModifyModal;
