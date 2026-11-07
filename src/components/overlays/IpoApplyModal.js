import React, { useState, useContext, useMemo } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import "./IpoApplyModal.css";

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

const IpoApplyModal = ({ ipo, onClose, onAppliedSuccess }) => {
  const { currentUser, showToast, refreshPortfolio } = useContext(GeneralContext);

  // Parse price range e.g. "₹371 - ₹390"
  const { minPrice, maxPrice, lotSize } = useMemo(() => {
    let minP = 100;
    let maxP = 100;
    if (ipo?.priceRange) {
      const parts = ipo.priceRange.replace(/[₹,]/g, "").split("-");
      if (parts.length >= 2) {
        minP = parseFloat(parts[0].trim()) || 100;
        maxP = parseFloat(parts[1].trim()) || 100;
      } else {
        minP = maxP = parseFloat(parts[0].trim()) || 100;
      }
    }
    const lSize = ipo?.minQty || 1;
    return { minPrice: minP, maxPrice: maxP, lotSize: lSize };
  }, [ipo]);

  const [category, setCategory] = useState("INDIVIDUAL"); // "INDIVIDUAL" | "HNI"
  const [upiUser, setUpiUser] = useState("");
  const [upiHandle, setUpiHandle] = useState("@okhdfcbank");
  const [lots, setLots] = useState(1);
  const [isCutOff, setIsCutOff] = useState(true);
  const [bidPrice, setBidPrice] = useState(maxPrice);
  const [declared, setDeclared] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demat & PAN pre-filled from user profile
  const dematBoId = currentUser?.demat || "1208160081236464";
  const userPan = currentUser?.pan || "ABCDE1234F";
  const userEmail = currentUser?.email || "trader@example.com";

  // Calculations
  const totalQty = lots * lotSize;
  const effectivePrice = isCutOff ? maxPrice : (parseFloat(bidPrice) || maxPrice);
  const totalAmount = totalQty * effectivePrice;

  // Max lots based on category ceiling
  const maxLots = category === "INDIVIDUAL" ? Math.floor(200000 / (lotSize * effectivePrice)) : 50;

  const handleLotChange = (delta) => {
    const next = lots + delta;
    if (next >= 1 && next <= maxLots) {
      setLots(next);
    }
  };

  const fullUpiId = `${upiUser.trim()}${upiHandle}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!upiUser.trim()) {
      showToast("UPI Required", "Please enter your UPI handle (e.g. 9876543210 or yourname).", "error");
      return;
    }

    if (!declared) {
      showToast("Declaration Required", "Please confirm the SEBI ASBA eligibility declaration.", "error");
      return;
    }

    if (category === "INDIVIDUAL" && totalAmount > 200000) {
      showToast(
        "Retail Limit Exceeded",
        "Retail individual bids cannot exceed ₹2,00,000. Switch to HNI category.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUser?.userId,
        userEmail,
        ipoSymbol: ipo.symbol,
        companyName: ipo.name,
        category,
        upiId: fullUpiId,
        lots,
        lotSize,
        totalQty,
        bidPrice: effectivePrice,
        isCutOff,
        totalAmount,
        dematBoId,
        pan: userPan,
      };

      const res = await axios.post(`${API_BASE}/applyIpo`, payload);
      if (res.data?.success) {
        showToast(
          "IPO Bid Submitted!",
          `UPI Mandate sent to ${userEmail}. Please check your email to authorize the block.`,
          "success"
        );
        refreshPortfolio();
        if (onAppliedSuccess) onAppliedSuccess(res.data.application);
        onClose();
      }
    } catch (err) {
      showToast(
        "Application Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ipo-modal-overlay" onClick={onClose}>
      <div className="ipo-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ipo-modal-header">
          <div className="ipo-header-main">
            <div className="ipo-symbol-tag">{ipo.symbol}</div>
            <div>
              <h3 className="ipo-company-title">{ipo.name}</h3>
              <div className="ipo-header-meta">
                <span>Issue: {ipo.dates}</span>
                <span className="dot-sep">&bull;</span>
                <span>Price: {ipo.priceRange}</span>
                <span className="dot-sep">&bull;</span>
                <span>1 Lot = {lotSize} Shares</span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ipo-modal-body">
          {/* Investor Category Tabs (Option A) */}
          <div className="ipo-form-group">
            <label className="ipo-field-label">INVESTOR CATEGORY</label>
            <div className="category-pill-group">
              <button
                type="button"
                className={`category-pill ${category === "INDIVIDUAL" ? "active" : ""}`}
                onClick={() => setCategory("INDIVIDUAL")}
              >
                Individual (Retail &le; ₹2L)
              </button>
              <button
                type="button"
                className={`category-pill ${category === "HNI" ? "active" : ""}`}
                onClick={() => setCategory("HNI")}
              >
                HNI (&gt; ₹2 Lakhs)
              </button>
            </div>
          </div>

          {/* Demat & PAN info row */}
          <div className="ipo-meta-grid">
            <div className="meta-box">
              <span className="meta-label">DEPOSITORY & BO ID</span>
              <span className="meta-val">CDSL &bull; {dematBoId}</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">APPLICANT PAN</span>
              <span className="meta-val">{userPan}</span>
            </div>
          </div>

          {/* UPI ID Input (Option C) */}
          <div className="ipo-form-group">
            <label className="ipo-field-label">
              UPI ID (FOR ASBA BLOCK) <span className="req">*</span>
            </label>
            <div className="upi-input-wrapper">
              <input
                type="text"
                placeholder="e.g. 9876543210 or yourname"
                value={upiUser}
                onChange={(e) => setUpiUser(e.target.value.replace(/@.*/, ""))}
                className="upi-user-input"
                required
              />
              <select
                value={upiHandle}
                onChange={(e) => setUpiHandle(e.target.value)}
                className="upi-handle-select"
              >
                {UPI_HANDLES.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <span className="field-hint">
              Bank account linked with this UPI ID must carry PAN: <strong>{userPan}</strong>
            </span>
          </div>

          {/* Bidding Parameters (Option A) */}
          <div className="ipo-bid-box">
            <div className="bid-box-header">
              <span className="bid-title">PRIMARY BID</span>
              <label className="cutoff-toggle">
                <input
                  type="checkbox"
                  checked={isCutOff}
                  onChange={(e) => {
                    setIsCutOff(e.target.checked);
                    if (e.target.checked) setBidPrice(maxPrice);
                  }}
                />
                <span>Cut-off price (₹{maxPrice})</span>
              </label>
            </div>

            <div className="bid-inputs-row">
              <div className="bid-col">
                <label className="sub-label">LOTS</label>
                <div className="lot-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleLotChange(-1)}
                    disabled={lots <= 1}
                  >
                    &minus;
                  </button>
                  <span className="lot-count">{lots}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleLotChange(1)}
                    disabled={lots >= maxLots}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bid-col">
                <label className="sub-label">TOTAL SHARES</label>
                <div className="shares-display">{totalQty} shares</div>
              </div>

              <div className="bid-col">
                <label className="sub-label">BID PRICE (₹)</label>
                <input
                  type="number"
                  disabled={isCutOff}
                  min={minPrice}
                  max={maxPrice}
                  step="1"
                  value={effectivePrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  className="bid-price-input"
                />
              </div>
            </div>
          </div>

          {/* Amount to block banner */}
          <div className="block-amount-card">
            <div>
              <span className="amount-card-label">TOTAL AMOUNT PAYABLE / BLOCKED</span>
              <span className="amount-card-sub">Under SEBI ASBA Mandate</span>
            </div>
            <div className="amount-card-val">
              ₹
              {totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Email Notification Notice (Option C) */}
          <div className="email-mandate-alert">
            <div className="mail-icon">✉️</div>
            <div className="mail-text">
              <strong>Live Email UPI Mandate:</strong> An authorization email with one-click{" "}
              <strong style={{ color: "#16a34a" }}>[Approve]</strong> and{" "}
              <strong style={{ color: "#dc2626" }}>[Decline]</strong> buttons will be dispatched immediately to:
              <div className="user-email-tag">{userEmail}</div>
            </div>
          </div>

          {/* Declaration Checkbox */}
          <label className="ipo-declaration">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              required
            />
            <span>
              I have read the Red Herring Prospectus (RHP) and declare that I am eligible to apply under SEBI ASBA
              guidelines as an Individual investor.
            </span>
          </label>

          {/* Actions */}
          <div className="ipo-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-ipo" disabled={isSubmitting || !declared}>
              {isSubmitting ? "Submitting Bid..." : "Submit IPO Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IpoApplyModal;
