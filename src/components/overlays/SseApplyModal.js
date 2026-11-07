import React, { useState } from "react";
import axios from "axios";
import "./SseApplyModal.css";

const API_BASE = "http://localhost:3002";

const SseApplyModal = ({
  sseIpo,
  onClose,
  onApplySuccess,
  currentUser,
  showToast,
  refreshPortfolio,
}) => {
  const [units, setUnits] = useState(100); // 100 units minimum
  const [panNumber, setPanNumber] = useState(currentUser?.pan || "ABCDE1234F");
  const [upiId, setUpiId] = useState(currentUser?.upiId || "investor@okhdfcbank");
  const [taxReceiptRequested, setTaxReceiptRequested] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!sseIpo) return null;

  const unitPrice = sseIpo.unitPrice || 100;
  const totalAmount = units * unitPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (units < 100) {
      setErrorMsg("Minimum application size for SSE ZCZP instruments is 100 units (₹10,000).");
      return;
    }

    if (!panNumber || panNumber.trim().length !== 10) {
      setErrorMsg("A valid 10-character PAN is mandatory for Section 80G tax benefit claim.");
      return;
    }

    if (!upiId || !upiId.includes("@")) {
      setErrorMsg("Please enter a valid UPI ID (e.g. yourname@okhdfcbank) to authorize the ASBA lien.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/applySseIpo`, {
        userId: currentUser?.userId,
        symbol: sseIpo.symbol,
        orgName: sseIpo.orgName,
        units,
        panNumber: panNumber.trim().toUpperCase(),
        upiId: upiId.trim(),
        taxReceiptRequested,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "SSE Application Submitted",
            `Successfully contributed ₹${totalAmount.toLocaleString("en-IN")} (${units} units) to ${sseIpo.orgName}!`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onApplySuccess) onApplySuccess(res.data.application);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to submit SSE application.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit SSE application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sse-modal-backdrop" onClick={onClose}>
      <div className="sse-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="sse-modal-header">
          <div>
            <div className="sse-badge-row">
              <span className="sse-tag-pill">Social Stock Exchange (SSE)</span>
              <span className="sse-tax-pill">🏷️ 100% Tax Exempt u/s 80G</span>
            </div>
            <h3 className="sse-title">{sseIpo.orgName}</h3>
            <span className="sse-cause-text">Cause: {sseIpo.focusArea}</span>
          </div>
          <button className="sse-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {errorMsg && <div className="sse-error-banner">{errorMsg}</div>}

        {/* Impact Highlight Card */}
        <div className="sse-impact-card">
          <div className="impact-header">
            <span className="impact-label">Audited Social Impact Objective</span>
            <span className="impact-reg">SEBI Reg: {sseIpo.sebiRegNo}</span>
          </div>
          <p className="impact-goal-desc">{sseIpo.impactGoal}</p>
          <div className="auditor-row">
            <span>Social Auditor: <strong>{sseIpo.socialAuditor}</strong></span>
            <span>Target Size: <strong>{sseIpo.targetAmount}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sse-form">
          {/* Units Selection (Multiples of 100) */}
          <div className="form-group-sse">
            <div className="label-row-sse">
              <label>Pledge Units (₹100 per ZCZP Unit)</label>
              <span className="min-lot-text">Min: 100 units</span>
            </div>
            <div className="units-stepper-wrap">
              <button
                type="button"
                className="btn-counter"
                onClick={() => setUnits(Math.max(100, units - 100))}
                disabled={units <= 100}
              >
                -100
              </button>
              <div className="units-display">
                <strong>{units} Units</strong>
                <span className="amount-subtext">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <button
                type="button"
                className="btn-counter"
                onClick={() => setUnits(units + 100)}
              >
                +100
              </button>
            </div>
          </div>

          {/* PAN Number for Section 80G Certificate */}
          <div className="form-group-sse">
            <label>PAN Number (For Form 10BE Tax Exemption)</label>
            <input
              type="text"
              maxLength="10"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              className="input-text-pan"
              placeholder="ABCDE1234F"
              required
            />
          </div>

          {/* UPI ID for ASBA Block */}
          <div className="form-group-sse">
            <label>UPI ID for Bank Lien Block (ASBA)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="input-text-upi"
              placeholder="yourname@okhdfcbank"
              required
            />
            <span className="help-text">
              Funds remain blocked in your bank account earning interest until issue allotment.
            </span>
          </div>

          {/* 80G Receipt Checkbox */}
          <div className="checkbox-wrap-sse">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={taxReceiptRequested}
                onChange={(e) => setTaxReceiptRequested(e.target.checked)}
              />
              <span>Generate Section 80G Tax Exemption Certificate for Income Tax filing</span>
            </label>
          </div>

          {/* Total Block Summary */}
          <div className="sse-summary-box">
            <div className="summary-row">
              <span>Total Contribution (ASBA Lien):</span>
              <strong className="text-blue">₹{totalAmount.toLocaleString("en-IN")}</strong>
            </div>
            <div className="summary-row small">
              <span>Instrument Type:</span>
              <span>Zero Coupon Zero Principal (ZCZP)</span>
            </div>
          </div>

          <div className="sse-modal-actions">
            <button type="button" className="btn-sse-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sse-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : `Authorize Pledge of ₹${totalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SseApplyModal;
