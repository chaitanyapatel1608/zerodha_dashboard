import React from "react";
import "./FundPoliciesModal.css";

const FundPoliciesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fund-policy-backdrop" onClick={onClose}>
      <div className="fund-policy-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="fund-policy-header">
          <div className="fund-policy-title-box">
            <span className="fund-policy-badge">SEBI & EXCHANGE COMPLIANCE</span>
            <h3 className="fund-policy-title">Kite Treasury & Funds Policy Guide</h3>
            <span className="fund-policy-subtitle">
              Comprehensive guidelines for payins, withdrawals, Demat pledging, and clearing settlement
            </span>
          </div>
          <button className="fund-policy-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="fund-policy-body">
          {/* Section 1: Payin & Deposit Modes */}
          <div className="fund-policy-card">
            <div className="fund-card-header">
              <span className="fund-icon">⚡</span>
              <h4>Fund Addition (Payin) Timelines & Limits</h4>
            </div>
            <p className="fund-card-desc">
              All deposits must originate strictly from your verified bank accounts mapped with your PAN. Third-party transfers are prohibited under SEBI anti-money laundering (AML) regulations.
            </p>
            <div className="fund-modes-grid">
              <div className="mode-box highlight-green">
                <div className="mode-top">
                  <span className="mode-name">UPI (Instant)</span>
                  <span className="mode-badge-free">ZERO FEE</span>
                </div>
                <div className="mode-timing">Instant &bull; 24x7</div>
                <div className="mode-note">Limit: ₹100 up to ₹2,00,000 per transaction via GPay, PhonePe, BHIM, or Netbanking UPI.</div>
              </div>

              <div className="mode-box">
                <div className="mode-top">
                  <span className="mode-name">Netbanking Gateway</span>
                  <span className="mode-fee">₹9 + GST</span>
                </div>
                <div className="mode-timing">Instant &bull; 25+ Banks</div>
                <div className="mode-note">Instant margin credit directly integrated with major private and PSU banking portals.</div>
              </div>

              <div className="mode-box">
                <div className="mode-top">
                  <span className="mode-name">NEFT / RTGS / IMPS</span>
                  <span className="mode-badge-free">ZERO FEE</span>
                </div>
                <div className="mode-timing">1 to 2 Hours (Working Days)</div>
                <div className="mode-note">Transfer to your dedicated virtual account number (VAN). Processed between 07:00 and 19:00 IST.</div>
              </div>
            </div>
          </div>

          {/* Section 2: Payout & Withdrawal Schedule */}
          <div className="fund-policy-card">
            <div className="fund-card-header">
              <span className="fund-icon">🏦</span>
              <h4>Funds Withdrawal (Payout) Schedule & Cut-Offs</h4>
            </div>
            <p className="fund-card-desc">
              Payouts are processed via automated NEFT/IMPS clearing batches directly to your Primary Verified Bank Account:
            </p>
            <div className="payout-timeline-list">
              <div className="timeline-item">
                <span className="timeline-bullet"></span>
                <div className="timeline-content">
                  <strong>Daily Cut-Off at 20:30 IST:</strong>
                  <span>Withdrawal requests placed on trading days before 20:30 IST are processed the same night and credited by 06:00 IST the next morning.</span>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-bullet"></span>
                <div className="timeline-content">
                  <strong>Weekend & Exchange Holiday Clearing:</strong>
                  <span>Requests placed after 20:30 IST on Friday or during clearing holidays are processed on the next business clearing day.</span>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-bullet"></span>
                <div className="timeline-content">
                  <strong>T+1 Exchange Settlement Availability:</strong>
                  <span>
                    When selling equity delivery shares, 80% margin is usable immediately on T-day for new orders. The entire 100% balance becomes withdrawable on T+1 day once the clearing corporation confirms settlement.
                  </span>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-bullet"></span>
                <div className="timeline-content">
                  <strong>Intraday & F&O Realized Profits:</strong>
                  <span>
                    Unsettled intraday and derivatives profits are credited to your withdrawable ledger on the next working day post mark-to-market settlement.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Demat Margin Pledging & Haircuts */}
          <div className="fund-policy-card">
            <div className="fund-card-header">
              <span className="fund-icon">🔒</span>
              <h4>Demat Collateral Pledging & Haircuts (SEBI Demat Pledge)</h4>
            </div>
            <div className="pledge-rules-summary">
              <div className="rule-item">
                <strong>Depository Lien:</strong>
                <span>Shares remain safely held in your Demat account under your CDSL BO ID. All corporate benefits (dividends, bonus shares, rights issues) continue to accrue to you.</span>
              </div>
              <div className="rule-item">
                <strong>SEBI Haircuts:</strong>
                <span>Haircuts are dynamically calculated based on stock volatility (12.5% for Nifty 50 benchmarks, 15% for large-caps, 20% for other eligible securities).</span>
              </div>
              <div className="rule-item">
                <strong>50:50 Cash-Collateral Ratio:</strong>
                <span>Overnight F&O positions require at least 50% of required margin in cash or cash-equivalents; the remaining 50% can be funded through non-cash stock collateral.</span>
              </div>
            </div>
          </div>

          {/* Section 4: Quarterly Settlement / Running Account */}
          <div className="fund-policy-card">
            <div className="fund-card-header">
              <span className="fund-icon">📜</span>
              <h4>Quarterly Running Account Settlement (SEBI Mandate)</h4>
            </div>
            <p className="fund-card-desc">
              Under SEBI circular guidelines, all unutilized credit balances in your trading ledger are automatically transferred back to your primary bank account on the first Friday of each calendar quarter (or monthly if chosen). No brokerage or handling fees are levied for quarterly settlements.
            </p>
          </div>
        </div>

        <div className="fund-policy-footer">
          <div className="footer-regulatory-text">
            <span>🛡️ SEBI Registered Stock Broker: INZ000031633 &bull; CDSL Depository Participant: IN-DP-431-2019</span>
          </div>
          <button type="button" className="fund-policy-btn-ack" onClick={onClose}>
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundPoliciesModal;