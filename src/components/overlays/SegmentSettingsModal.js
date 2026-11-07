import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import "./SegmentSettingsModal.css";

const API_BASE = "http://localhost:3002";

const SEGMENT_DEFINITIONS = [
  {
    key: "equity",
    title: "NSE & BSE Equity (Cash)",
    exchange: "NSE, BSE",
    badge: "Core Demat",
    description: "Delivery (CNC) and Intraday (MIS) trading in shares, ETFs, and Sovereign Gold Bonds.",
    instruments: ["INFY", "RELIANCE", "TCS", "HDFCBANK", "ETFs"],
    requiresIncomeProof: false,
  },
  {
    key: "futuresAndOptions",
    title: "Futures & Options (F&O)",
    exchange: "NFO, BFO",
    badge: "Derivatives",
    description: "Index (NIFTY, BANKNIFTY) and Stock derivative contracts. High leverage / margin instruments.",
    instruments: ["NIFTY FUT", "BANKNIFTY CE/PE", "Stock Options"],
    requiresIncomeProof: true,
  },
  {
    key: "currency",
    title: "Currency Derivatives (CDS)",
    exchange: "CDS, BCD",
    badge: "Forex",
    description: "Currency futures and options for pairs like USD-INR, EUR-INR, GBP-INR, and JPY-INR.",
    instruments: ["USDINR FUT", "EURINR", "GBPINR"],
    requiresIncomeProof: true,
  },
  {
    key: "commodity",
    title: "Commodity Derivatives",
    exchange: "MCX",
    badge: "MCX",
    description: "Energy, Base Metals, and Bullion contracts including Crude Oil, Natural Gas, Gold, and Silver.",
    instruments: ["CRUDEOIL", "NATURALGAS", "GOLD", "SILVER"],
    requiresIncomeProof: true,
  },
];

const INCOME_TIERS = [
  "Below ₹1 Lakh",
  "₹1 Lakh - ₹5 Lakhs",
  "₹5 Lakhs - ₹10 Lakhs",
  "₹10 Lakhs - ₹25 Lakhs",
  "Above ₹25 Lakhs",
];

const SegmentSettingsModal = ({ isOpen, onClose }) => {
  const { currentUser, showToast, refreshPortfolio } = useContext(GeneralContext);

  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [userDemat, setUserDemat] = useState("");
  const [userAnnualIncome, setUserAnnualIncome] = useState("₹1 Lakh - ₹5 Lakhs");

  // Deactivation confirmation dialog (Kill Switch)
  const [segmentToDeactivate, setSegmentToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Activation modal (for disabled segments)
  const [segmentToActivate, setSegmentToActivate] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState("₹1 Lakh - ₹5 Lakhs");
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState(false);
  const [activationMethod, setActivationMethod] = useState("DECLARATION"); // "DECLARATION" or "OTP"
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Live second ticker for countdowns
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSegments = useCallback(async () => {
    if (!currentUser?.userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/userSegments`, {
        params: { userId: currentUser.userId },
      });
      if (res.data?.success && res.data.segments) {
        setSegments(res.data.segments);
        if (res.data.userDemat) setUserDemat(res.data.userDemat);
        if (res.data.annualIncome) {
          setUserAnnualIncome(res.data.annualIncome);
          setSelectedIncome(res.data.annualIncome);
        }
      }
    } catch (e) {
      console.warn("Could not fetch segments:", e.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchSegments();
    }
  }, [isOpen, fetchSegments]);

  if (!isOpen) return null;

  // Format countdown remaining
  const formatCooldown = (deactivatedAt) => {
    if (!deactivatedAt) return null;
    const deactTime = new Date(deactivatedAt).getTime();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const diff = twelveHoursMs - (now - deactTime);
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  const handleToggleClick = (def, currentSeg) => {
    const isActive = currentSeg?.active ?? false;
    const cooldown = formatCooldown(currentSeg?.deactivatedAt);

    if (isActive) {
      // User is turning active segment OFF -> trigger Kill Switch confirmation
      setSegmentToDeactivate({ def, currentSeg });
    } else {
      // If locked under Kill Switch
      if (cooldown) {
        showToast(
          "Kill Switch Active",
          `Reactivation for ${def.title} is locked for another ${cooldown} to prevent overtrading.`,
          "error"
        );
        return;
      }
      // Open Activation flow
      setSegmentToActivate({ def, currentSeg });
      setHasAcceptedRisk(false);
      setOtp("");
      setOtpSent(false);
    }
  };

  // Confirm Kill Switch Deactivation
  const handleConfirmDeactivate = async () => {
    if (!segmentToDeactivate) return;
    setIsDeactivating(true);
    try {
      const res = await axios.post(`${API_BASE}/updateSegments`, {
        userId: currentUser?.userId,
        segmentKey: segmentToDeactivate.def.key,
        targetState: false,
      });
      if (res.data?.success) {
        showToast(
          "Kill Switch Engaged",
          `${segmentToDeactivate.def.title} has been deactivated. Locked for 12 hours.`,
          "success"
        );
        fetchSegments();
        refreshPortfolio();
        setSegmentToDeactivate(null);
      }
    } catch (e) {
      showToast(
        "Deactivation Failed",
        e.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  // Send OTP for Activation
  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/sendSegmentOtp`, {
        userId: currentUser?.userId,
        email: currentUser?.email,
        segmentKey: segmentToActivate.def.key,
      });
      if (res.data?.success) {
        setOtpSent(true);
        showToast("OTP Dispatched", res.data.message, "success");
        if (res.data.devOtp) {
          console.log(`[DEV OTP] Segment activation OTP: ${res.data.devOtp}`);
        }
      }
    } catch (e) {
      showToast("OTP Failed", e.response?.data?.message || e.message, "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Confirm Activation (Declaration or OTP)
  const handleConfirmActivation = async () => {
    if (!segmentToActivate) return;
    if (!hasAcceptedRisk) {
      showToast("Declaration Required", "Please acknowledge the SEBI regulatory risk disclosure.", "error");
      return;
    }

    setIsActivating(true);
    try {
      if (activationMethod === "OTP") {
        if (!otp.trim()) {
          showToast("OTP Required", "Please enter the 6-digit verification code sent to your email.", "error");
          setIsActivating(false);
          return;
        }
        const res = await axios.post(`${API_BASE}/verifySegmentOtp`, {
          userId: currentUser?.userId,
          email: currentUser?.email,
          otp: otp.trim(),
          segmentKey: segmentToActivate.def.key,
          annualIncome: selectedIncome,
        });
        if (res.data?.success) {
          showToast("Segment Activated", `${segmentToActivate.def.title} is now active!`, "success");
          fetchSegments();
          refreshPortfolio();
          setSegmentToActivate(null);
        }
      } else {
        // Direct Regulatory Self-Declaration
        const res = await axios.post(`${API_BASE}/updateSegments`, {
          userId: currentUser?.userId,
          segmentKey: segmentToActivate.def.key,
          targetState: true,
          annualIncome: selectedIncome,
        });
        if (res.data?.success) {
          showToast("Segment Activated", `${segmentToActivate.def.title} is now active!`, "success");
          fetchSegments();
          refreshPortfolio();
          setSegmentToActivate(null);
        }
      }
    } catch (e) {
      showToast(
        "Activation Failed",
        e.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="segment-modal-backdrop" onClick={onClose}>
      <div className="segment-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="segment-modal-header">
          <div className="header-title-group">
            <div className="header-shield-icon">🛡️</div>
            <div>
              <h3>Segments & Kill Switch Settings</h3>
              <p className="header-subtitle">
                SEBI Risk Mitigation &bull; Demat: <strong>{userDemat || currentUser?.userId || "Active"}</strong>
              </p>
            </div>
          </div>
          <button className="segment-modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Nudge Banner */}
        <div className="segment-nudge-banner">
          <div className="nudge-icon">ℹ</div>
          <div className="nudge-text">
            <strong>SEBI Kill Switch Regulation:</strong> Disabling any trading segment helps prevent emotional revenge trading. Once deactivated, the segment enters a mandatory <strong>12-hour lock</strong> before it can be reactivated.
          </div>
        </div>

        {/* Segments Cards List */}
        <div className="segment-cards-list">
          {loading ? (
            <div className="segment-loading">
              <span className="spinner-border spinner-border-sm me-2"></span>
              Loading Demat segments configuration...
            </div>
          ) : (
            SEGMENT_DEFINITIONS.map((def) => {
              const currentSeg = segments[def.key];
              const isActive = currentSeg?.active ?? false;
              const cooldown = formatCooldown(currentSeg?.deactivatedAt);
              const isLocked = !isActive && !!cooldown;

              return (
                <div
                  key={def.key}
                  className={`segment-card ${isActive ? "card-active" : isLocked ? "card-locked" : "card-inactive"}`}
                >
                  <div className="segment-card-main">
                    <div className="segment-header-row">
                      <div className="segment-name-wrap">
                        <span className="segment-title">{def.title}</span>
                        <span className="segment-exchange-tag">{def.exchange}</span>
                        <span className={`segment-badge-tag badge-${def.badge.toLowerCase()}`}>
                          {def.badge}
                        </span>
                      </div>

                      {/* State Pill */}
                      <div className="segment-state-pill">
                        {isActive ? (
                          <span className="pill-active">
                            <span className="pulse-dot"></span> ACTIVE
                          </span>
                        ) : isLocked ? (
                          <span className="pill-locked" title="Kill Switch Active">
                            🔒 LOCKED ({cooldown})
                          </span>
                        ) : (
                          <span className="pill-inactive">INACTIVE</span>
                        )}
                      </div>
                    </div>

                    <p className="segment-desc">{def.description}</p>

                    <div className="segment-sample-chips">
                      <span className="chips-label">Instruments:</span>
                      {def.instruments.map((inst, idx) => (
                        <span key={idx} className="inst-chip">
                          {inst}
                        </span>
                      ))}
                    </div>

                    {isLocked && (
                      <div className="segment-cooldown-notice">
                        <span className="lock-icon">⏳</span>
                        <span>
                          Deactivated via Kill Switch. Automatic unlock in <strong>{cooldown}</strong>.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <div className="segment-toggle-wrapper">
                    <label
                      className={`switch ${isLocked ? "switch-disabled" : ""}`}
                      title={
                        isLocked
                          ? `Locked for ${cooldown}`
                          : isActive
                          ? "Click to deactivate via Kill Switch"
                          : "Click to activate this segment"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={isLocked}
                        onChange={() => handleToggleClick(def, currentSeg)}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className="toggle-label-text">
                      {isActive ? "Turn Off" : isLocked ? "Locked" : "Activate"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="segment-modal-footer">
          <div className="footer-info">
            Annual Income: <strong>{userAnnualIncome}</strong> &bull; Broker: <strong>Zerodha Broking Ltd.</strong>
          </div>
          <button type="button" className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>

        {/* Sub-Modal: Kill Switch Deactivation Confirmation */}
        {segmentToDeactivate && (
          <div className="segment-submodal-overlay">
            <div className="segment-submodal deactivation-dialog">
              <div className="submodal-header warning">
                <span className="submodal-icon">⚠️</span>
                <h4>Engage Kill Switch for {segmentToDeactivate.def.title}?</h4>
              </div>

              <div className="submodal-body">
                <p>
                  You are about to voluntarily disable <strong>{segmentToDeactivate.def.title}</strong> to enforce risk discipline.
                </p>

                <div className="warning-callout">
                  <strong>Important Notice:</strong>
                  <ul>
                    <li>All open order placements for this segment will be blocked.</li>
                    <li>
                      As per SEBI risk rules, this segment <strong>cannot be reactivated for 12 hours</strong> once disabled.
                    </li>
                    <li>This lock cannot be bypassed or overridden until the timer expires.</li>
                  </ul>
                </div>
              </div>

              <div className="submodal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSegmentToDeactivate(null)}
                  disabled={isDeactivating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={handleConfirmDeactivate}
                  disabled={isDeactivating}
                >
                  {isDeactivating ? "Engaging Lock..." : "Yes, Engage 12-Hour Kill Switch"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Modal: Segment Activation Flow */}
        {segmentToActivate && (
          <div className="segment-submodal-overlay">
            <div className="segment-submodal activation-dialog">
              <div className="submodal-header primary">
                <span className="submodal-icon">📈</span>
                <h4>Activate {segmentToActivate.def.title}</h4>
              </div>

              <div className="submodal-body">
                <p className="activation-intro">
                  Complete SEBI Demat declaration to enable order placement for{" "}
                  <strong>{segmentToActivate.def.exchange}</strong>.
                </p>

                {/* Income Range Selector */}
                <div className="form-group-activation">
                  <label>Gross Annual Income Bracket (SEBI Mandate):</label>
                  <select
                    className="form-select-income"
                    value={selectedIncome}
                    onChange={(e) => setSelectedIncome(e.target.value)}
                  >
                    {INCOME_TIERS.map((tier, idx) => (
                      <option key={idx} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification Mode Choice */}
                <div className="activation-mode-toggle">
                  <label className={`mode-pill ${activationMethod === "DECLARATION" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="actMode"
                      value="DECLARATION"
                      checked={activationMethod === "DECLARATION"}
                      onChange={() => setActivationMethod("DECLARATION")}
                    />
                    <span>⚡ Instant Self-Declaration</span>
                  </label>
                  <label className={`mode-pill ${activationMethod === "OTP" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="actMode"
                      value="OTP"
                      checked={activationMethod === "OTP"}
                      onChange={() => setActivationMethod("OTP")}
                    />
                    <span>✉️ Email OTP Verification</span>
                  </label>
                </div>

                {activationMethod === "OTP" && (
                  <div className="otp-verification-box">
                    <p className="otp-instruct">
                      Verify identity via code sent to <strong>{currentUser?.email || "your email"}</strong>:
                    </p>
                    <div className="otp-input-row">
                      <input
                        type="text"
                        placeholder="6-Digit OTP"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="input-otp"
                      />
                      <button
                        type="button"
                        className="btn-send-otp"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Risk Disclosure Box */}
                <div className="risk-disclosure-card">
                  <h5>SEBI Regulatory Risk Disclosure on Derivatives & Commodities:</h5>
                  <p>
                    &bull; 9 out of 10 individual traders in equity Futures & Options segment incurred net losses.
                    <br />
                    &bull; Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading losses as transaction costs.
                    <br />
                    &bull; Derivatives are complex instruments and carry a high risk of losing money rapidly due to leverage.
                  </p>
                  <label className="checkbox-risk-agree">
                    <input
                      type="checkbox"
                      checked={hasAcceptedRisk}
                      onChange={(e) => setHasAcceptedRisk(e.target.checked)}
                    />
                    <span>I understand and accept the SEBI risk disclosure and confirm my annual income.</span>
                  </label>
                </div>
              </div>

              <div className="submodal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSegmentToActivate(null)}
                  disabled={isActivating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-activate"
                  onClick={handleConfirmActivation}
                  disabled={isActivating || !hasAcceptedRisk}
                >
                  {isActivating ? "Activating..." : `Activate ${segmentToActivate.def.badge}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentSettingsModal;
