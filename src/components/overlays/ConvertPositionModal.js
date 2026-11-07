import React, { useState } from "react";
import axios from "axios";
import "./ConvertPositionModal.css";

const API_BASE = "http://localhost:3002";

const ConvertPositionModal = ({ isOpen, onClose, position, currentUser, availableMargin, onConversionSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [chosenTarget, setChosenTarget] = useState("NRML");

  if (!isOpen || !position) return null;

  const sym = position.instrument || position.name;
  const currentProduct = (position.product || "MIS").toUpperCase();
  const qty = Math.abs(position.qty || 0);
  const avg = position.avg || position.price || 0;
  const totalCost = qty * avg;

  // If MIS -> target can be NRML or CNC. If CNC/NRML -> target is MIS.
  const targetProduct = currentProduct === "MIS" ? chosenTarget : "MIS";

  // Financial calculations
  const additionalMarginNeeded = currentProduct === "MIS" ? totalCost * 0.8 : 0;
  const marginReleased = currentProduct !== "MIS" ? totalCost * 0.8 : 0;
  const numAvailable = typeof availableMargin === "number" ? availableMargin : (Number(availableMargin) || 0);
  const hasSufficientMargin = currentProduct !== "MIS" || numAvailable >= additionalMarginNeeded;

  const handleConvert = async () => {
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/convertPosition`, {
        positionId: position._id,
        targetProduct,
        userId: currentUser?.userId,
      });

      if (res.data && res.data.success) {
        if (onConversionSuccess) onConversionSuccess(res.data.message);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to convert position.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to execute position conversion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="convert-modal-backdrop" onClick={onClose}>
      <div className="convert-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="convert-modal-header">
          <div>
            <span className="convert-badge">PRODUCT TYPE MODIFICATION</span>
            <h3 className="convert-title">Convert Position ({sym})</h3>
          </div>
          <button className="convert-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="convert-modal-body">
          {errorMsg && <div className="convert-alert error">{errorMsg}</div>}

          {/* Current Position Summary */}
          <div className="convert-summary-box">
            <div className="summary-prop">
              <span className="prop-label">Instrument</span>
              <span className="prop-val">{sym}</span>
            </div>
            <div className="summary-prop">
              <span className="prop-label">Quantity</span>
              <span className="prop-val">{position.qty > 0 ? `+${position.qty}` : position.qty} ({position.qty > 0 ? "LONG" : "SHORT"})</span>
            </div>
            <div className="summary-prop">
              <span className="prop-label">Avg. Execution Price</span>
              <span className="prop-val">₹{avg.toFixed(2)}</span>
            </div>
            <div className="summary-prop">
              <span className="prop-label">Gross Value</span>
              <span className="prop-val">₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Conversion Shift Indicator */}
          <div className="convert-direction-box">
            <div className="product-pill current">{currentProduct}</div>
            <span className="convert-arrow">&rarr;</span>
            {currentProduct === "MIS" ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={`product-pill ${chosenTarget === "NRML" ? "target" : ""}`}
                  style={{ cursor: "pointer", border: chosenTarget === "NRML" ? "2px solid #387ed1" : "1px solid #ccc", background: chosenTarget === "NRML" ? "#eff6ff" : "#fff", color: chosenTarget === "NRML" ? "#1e40af" : "#666" }}
                  onClick={() => setChosenTarget("NRML")}
                >
                  NRML (Overnight)
                </button>
                <button
                  type="button"
                  className={`product-pill ${chosenTarget === "CNC" ? "target" : ""}`}
                  style={{ cursor: "pointer", border: chosenTarget === "CNC" ? "2px solid #387ed1" : "1px solid #ccc", background: chosenTarget === "CNC" ? "#eff6ff" : "#fff", color: chosenTarget === "CNC" ? "#1e40af" : "#666" }}
                  onClick={() => setChosenTarget("CNC")}
                >
                  CNC (Delivery)
                </button>
              </div>
            ) : (
              <div className="product-pill target">{targetProduct}</div>
            )}
          </div>

          {/* Margin Requirements Analysis */}
          <div className="convert-margin-card">
            <div className="margin-row">
              <span className="m-label">Your Available Margin:</span>
              <span className="m-val">₹{numAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {currentProduct === "MIS" ? (
              <div className="margin-row highlight">
                <span className="m-label">Additional 80% Cash Margin Required:</span>
                <span className={`m-val ${hasSufficientMargin ? "text-green" : "text-red"}`}>
                  ₹{additionalMarginNeeded.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <div className="margin-row highlight-green">
                <span className="m-label">80% Margin Released to Available Cash:</span>
                <span className="m-val text-green">
                  +₹{marginReleased.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="margin-row border-top">
              <span className="m-label">Post-Conversion Balance:</span>
              <span className="m-val">
                ₹{Math.max(0, currentProduct === "MIS" ? numAvailable - additionalMarginNeeded : numAvailable + marginReleased).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Explanation Note */}
          <div className="convert-info-note">
            {currentProduct === "MIS" ? (
              <span>
                Converting from <strong>MIS</strong> to <strong>CNC</strong> converts this intraday lot into a delivery Demat asset that will not be automatically squared off at 15:20.
              </span>
            ) : (
              <span>
                Converting from <strong>CNC</strong> to <strong>MIS</strong> frees up 80% delivery margin for intraday trading, but subjects the position to the 15:20 auto square-off cut-off.
              </span>
            )}
          </div>
        </div>

        <div className="convert-modal-footer">
          <button className="btn-kite-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-kite-primary"
            onClick={handleConvert}
            disabled={isSubmitting || !hasSufficientMargin}
          >
            {isSubmitting ? "Converting..." : `Confirm Convert to ${targetProduct}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertPositionModal;
