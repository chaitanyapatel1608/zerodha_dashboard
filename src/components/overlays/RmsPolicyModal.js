import React from "react";
import "./RmsPolicyModal.css";

const RmsPolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rms-modal-backdrop" onClick={onClose}>
      <div className="rms-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rms-modal-header">
          <div className="rms-header-title-box">
            <span className="rms-badge">SEBI & RISK CONTROLS</span>
            <h3 className="rms-title">Risk Management System (RMS) Policies & Rules</h3>
          </div>
          <button className="rms-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="rms-modal-body">
          {/* Section 1: Intraday Auto Square-Off Schedule */}
          <div className="rms-policy-card">
            <div className="rms-card-header">
              <span className="rms-icon">⏰</span>
              <h4>Intraday Auto Square-Off Timings (MIS & CO)</h4>
            </div>
            <p className="rms-card-desc">
              All intraday positions (MIS product type) must be squared off before the stipulated cut-off time. Unclosed positions will be automatically squared off by our automated RMS engines at prevailing market prices:
            </p>
            <div className="rms-timings-grid">
              <div className="timing-box highlight">
                <span className="timing-segment">NSE & BSE Cash (Equity MIS)</span>
                <span className="timing-hour">15:20 IST</span>
                <span className="timing-note">Auto square-off begins</span>
              </div>
              <div className="timing-box highlight">
                <span className="timing-segment">Equity Futures & Options (NFO/BFO)</span>
                <span className="timing-hour">15:25 IST</span>
                <span className="timing-note">5 mins prior to market close</span>
              </div>
              <div className="timing-box">
                <span className="timing-segment">Currency Derivatives (CDS)</span>
                <span className="timing-hour">16:45 IST</span>
                <span className="timing-note">USDINR, EURINR cut-off</span>
              </div>
              <div className="timing-box">
                <span className="timing-segment">Commodity Derivatives (MCX)</span>
                <span className="timing-hour">23:15 / 23:40 IST</span>
                <span className="timing-note">Based on US daylight saving</span>
              </div>
            </div>
          </div>

          {/* Section 2: Call & Trade / Auto Square-off Charges */}
          <div className="rms-policy-card">
            <div className="rms-card-header">
              <span className="rms-icon">💳</span>
              <h4>Admin Square-Off Charges</h4>
            </div>
            <p className="rms-card-desc">
              An administrative Call & Trade fee of <strong>₹50 + 18% GST (Total ₹59.00)</strong> is levied per executed order for every position squared off by the RMS automated risk desk. To avoid these charges, please square off your open intraday positions manually before the 15:20 cut-off.
            </p>
          </div>

          {/* Section 3: SEBI Peak Margin & Intraday Leverage Framework */}
          <div className="rms-policy-card">
            <div className="rms-card-header">
              <span className="rms-icon">🛡️</span>
              <h4>SEBI Peak Margin & Maximum Leverage Limits</h4>
            </div>
            <div className="rms-rules-list">
              <div className="rms-rule-item">
                <span className="rule-bullet">1</span>
                <div>
                  <strong>Equity MIS Leverage:</strong> Maximum intraday leverage is capped at <strong>5x (20% margin)</strong> for 360+ approved high-liquidity stocks in compliance with SEBI peak margin mandates.
                </div>
              </div>
              <div className="rms-rule-item">
                <span className="rule-bullet">2</span>
                <div>
                  <strong>F&O Margin:</strong> Minimum 100% of SPAN + Exposure margin is mandated for overnight carry-forward (NRML) contracts.
                </div>
              </div>
              <div className="rms-rule-item">
                <span className="rule-bullet">3</span>
                <div>
                  <strong>Stoploss Liquidation (Margin Call):</strong> If your available cash margin erodes beyond <strong>80% of total portfolio value</strong> due to adverse market movements, RMS risk liquidation will automatically trigger without prior margin call notices.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rms-modal-footer">
          <span className="rms-footer-disclaimer">Zerodha Broking Limited &bull; Member: NSE/BSE/MCX &bull; SEBI Reg No: INZ000031633</span>
          <button className="btn-kite-primary" onClick={onClose}>
            I Understand the RMS Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default RmsPolicyModal;
