import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import "./CdslAuthModal.css";

const API_BASE = "http://localhost:3002";

const CdslAuthModal = ({
  isOpen,
  onClose,
  holding,
  userDemat,
  onAuthSuccess,
}) => {
  const { currentUser } = useContext(GeneralContext);

  const [step, setStep] = useState("TPIN"); // "TPIN" or "OTP"
  const [tpin, setTpin] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTpin, setIsGeneratingTpin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const stockName = holding?.instrument || holding?.name || "Shares";
  const stockQty = holding?.qty || 1;
  const stockVal = holding?.curVal || ((holding?.ltp || 100) * stockQty);
  const boId = userDemat || currentUser?.demat || "1208160012345678";
  const userEmail = currentUser?.email || "your email";

  const dispatchTpin = useCallback(async () => {
    setIsGeneratingTpin(true);
    setErrorMessage("");
    try {
      const res = await axios.post(`${API_BASE}/cdsl/generate-tpin`, {
        userId: currentUser?.userId,
      });
      if (res.data?.success) {
        setInfoMessage(
          `✉️ ${res.data.message}. Check your inbox/spam for the 6-digit code.`
        );
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to dispatch TPIN email.");
    } finally {
      setIsGeneratingTpin(false);
    }
  }, [currentUser]);

  // Automatically request/dispatch TPIN to email when modal opens if not already sent
  useEffect(() => {
    if (isOpen) {
      setStep("TPIN");
      setTpin("");
      setOtp("");
      setErrorMessage("");
      setInfoMessage(`Generating secure CDSL TPIN and dispatching to ${userEmail}...`);
      dispatchTpin();
    }
  }, [isOpen, dispatchTpin, userEmail]);

  const handleVerifyTpin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!tpin || tpin.length !== 6) {
      setErrorMessage("Please enter the 6-digit CDSL TPIN received on your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/cdsl/verify-tpin`, {
        userId: currentUser?.userId,
        tpin: tpin.trim(),
        stockName,
        stockQty,
      });

      if (res.data?.success) {
        setStep("OTP");
        setInfoMessage(`✉️ Transaction authorization OTP sent to ${userEmail}. Please enter the code below.`);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Invalid TPIN. Please check the code sent to your email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!otp || otp.length !== 6) {
      setErrorMessage("Please enter the 6-digit CDSL transaction OTP received on your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/cdsl/verify-otp`, {
        userId: currentUser?.userId,
        otp: otp.trim(),
        stockName,
      });

      if (res.data?.success) {
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Invalid or expired transaction OTP. Please check your email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cdsl-modal-backdrop" onClick={onClose}>
      <div className="cdsl-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header with CDSL Branding */}
        <div className="cdsl-modal-header">
          <div className="cdsl-brand-group">
            <div className="cdsl-badge">CDSL</div>
            <div>
              <h3>CDSL Demat E-DIS Authorization</h3>
              <p className="cdsl-subtitle">
                Central Depository Services (India) Limited &bull; Live Email Delivery
              </p>
            </div>
          </div>
          <button className="cdsl-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Demat Details Strip */}
        <div className="cdsl-demat-strip">
          <div className="demat-col">
            <span className="demat-label">Beneficiary Owner (BO ID):</span>
            <span className="demat-value">{boId}</span>
          </div>
          <div className="demat-col">
            <span className="demat-label">Registered Depository Email:</span>
            <span className="demat-value">{userEmail}</span>
          </div>
          <div className="demat-col">
            <span className="demat-label">Authorizing Asset:</span>
            <span className="demat-value highlight">
              {stockQty} shares of {stockName} (~₹{Number(stockVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="cdsl-security-note">
          <span className="shield-icon">🛡️</span>
          <span>
            SEBI regulatory requirement: CDSL TPIN & transaction OTP are dispatched directly to your registered email <strong>{userEmail}</strong>.
          </span>
        </div>

        {errorMessage && <div className="cdsl-alert error">{errorMessage}</div>}
        {infoMessage && <div className="cdsl-alert info">{infoMessage}</div>}

        {/* Step 1: TPIN Form */}
        {step === "TPIN" && (
          <form className="cdsl-form-body" onSubmit={handleVerifyTpin}>
            <div className="form-group-tpin">
              <label>Enter 6-Digit CDSL TPIN (Sent to {userEmail}):</label>
              <div className="tpin-input-wrap">
                <input
                  type="password"
                  maxLength="6"
                  placeholder="● ● ● ● ● ●"
                  value={tpin}
                  onChange={(e) => setTpin(e.target.value.replace(/\D/g, ""))}
                  className="tpin-input"
                  autoFocus
                />
              </div>
              <p className="tpin-hint">
                Check your email inbox/spam for subject: <strong>"CDSL Demat TPIN"</strong>
              </p>
            </div>

            <div className="cdsl-actions-row">
              <button
                type="button"
                className="btn-link-tpin"
                onClick={dispatchTpin}
                disabled={isGeneratingTpin}
              >
                {isGeneratingTpin ? "Sending new TPIN..." : "Resend / Generate New TPIN to Email &rsaquo;"}
              </button>
              <div className="button-group-right">
                <button type="button" className="btn-cdsl-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cdsl-verify"
                  disabled={isSubmitting || tpin.length !== 6}
                >
                  {isSubmitting ? "Verifying TPIN..." : "Verify TPIN & Proceed"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === "OTP" && (
          <form className="cdsl-form-body" onSubmit={handleVerifyOtp}>
            <div className="form-group-tpin">
              <label>Enter 6-Digit Transaction Authorization OTP:</label>
              <div className="tpin-input-wrap">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="0 0 0 0 0 0"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="tpin-input"
                  autoFocus
                />
              </div>
              <p className="tpin-hint">
                Dispatched by CDSL to <strong>{userEmail}</strong> (Subject: "CDSL E-DIS Transaction OTP")
              </p>
            </div>

            <div className="cdsl-actions-row">
              <button
                type="button"
                className="btn-link-tpin"
                onClick={() => setStep("TPIN")}
              >
                &lsaquo; Back to TPIN
              </button>
              <div className="button-group-right">
                <button type="button" className="btn-cdsl-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cdsl-verify"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? "Authorizing Exit..." : "Authorize Demat Exit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CdslAuthModal;
