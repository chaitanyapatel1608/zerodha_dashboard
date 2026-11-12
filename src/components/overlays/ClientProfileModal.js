import React, { useState } from "react";
import "./ClientProfileModal.css";

const ClientProfileModal = ({ isOpen, onClose, currentUser, onOpenNominee, onOpenSegment }) => {
  const [activeTab, setActiveTab] = useState("PROFILE");
  const [showPan, setShowPan] = useState(false);

  if (!isOpen) return null;

  const rawPan = currentUser?.pan || "ABCDE1234F";
  const maskedPan = showPan ? rawPan : rawPan.slice(0, 2) + "•••••" + rawPan.slice(-2);

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-user-row">
            <div className="profile-modal-avatar">
              {currentUser?.avatarText || "T"}
            </div>
            <div>
              <div className="profile-modal-title-row">
                <h3 className="profile-modal-name">{currentUser?.name || "Trader"}</h3>
                <span className="profile-modal-badge">{currentUser?.userId || "ZU9344"}</span>
                <span className="profile-status-pill">✓ SEBI KYC Verified</span>
              </div>
              <span className="profile-modal-email">{currentUser?.email || "chaitanya.expound@gmail.com"}</span>
            </div>
          </div>
          <button className="profile-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="profile-modal-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "PROFILE" ? "active" : ""}`}
            onClick={() => setActiveTab("PROFILE")}
          >
            Demat & Personal
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "BANK" ? "active" : ""}`}
            onClick={() => setActiveTab("BANK")}
          >
            Bank & Settlements
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "SEGMENTS" ? "active" : ""}`}
            onClick={() => setActiveTab("SEGMENTS")}
          >
            Segments & Nominees
          </button>
        </div>

        {/* Body Content */}
        <div className="profile-modal-body">
          {activeTab === "PROFILE" && (
            <div className="profile-tab-content">
              <div className="profile-section-title">CDSL Depository Details</div>
              <div className="profile-grid">
                <div className="profile-grid-item">
                  <span className="profile-label">Depository</span>
                  <span className="profile-value">CDSL (Central Depository Services Ltd.)</span>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">DP ID</span>
                  <span className="profile-value font-mono">12081600</span>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">16-Digit Demat BO ID</span>
                  <span className="profile-value font-mono highlight-blue">
                    {currentUser?.demat || "1208160012345678"}
                  </span>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">Account Category</span>
                  <span className="profile-value">Resident Individual (Ordinary)</span>
                </div>
              </div>

              <div className="profile-divider-subtle"></div>

              <div className="profile-section-title">Tax & Identity</div>
              <div className="profile-grid">
                <div className="profile-grid-item">
                  <span className="profile-label">PAN Number</span>
                  <div className="pan-display-row">
                    <span className="profile-value font-mono">{maskedPan}</span>
                    <button
                      type="button"
                      className="btn-pan-toggle"
                      onClick={() => setShowPan(!showPan)}
                    >
                      {showPan ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">Registered Mobile</span>
                  <span className="profile-value font-mono">+91 ••••• ••892</span>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">Brokerage Plan</span>
                  <span className="profile-value">Zerodha Free Equity Delivery (₹20 F&O)</span>
                </div>
                <div className="profile-grid-item">
                  <span className="profile-label">C-KYC Compliance</span>
                  <span className="profile-value text-green font-semibold">100% Fully Compliant</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "BANK" && (
            <div className="profile-tab-content">
              <div className="profile-section-title">Primary Settlement Bank Account</div>
              <div className="bank-card-highlight">
                <div className="bank-card-header">
                  <span className="bank-title">🏦 HDFC Bank</span>
                  <span className="badge-primary">PRIMARY PAYOUT</span>
                </div>
                <div className="bank-card-grid">
                  <div>
                    <span className="profile-label">Account Number</span>
                    <span className="profile-value font-mono">••••••••••••4821</span>
                  </div>
                  <div>
                    <span className="profile-label">IFSC Code</span>
                    <span className="profile-value font-mono">HDFC0000060</span>
                  </div>
                  <div>
                    <span className="profile-label">Account Type</span>
                    <span className="profile-value">Savings Account</span>
                  </div>
                  <div>
                    <span className="profile-label">NPCI Penny-Drop</span>
                    <span className="profile-value text-green">✓ Verified Active</span>
                  </div>
                </div>
              </div>

              <div className="profile-notice-box">
                <span>ℹ️</span>
                <span>
                  All trading payouts and quarterly running account settlements are deposited into this primary account. You can link and manage secondary bank accounts directly in the <strong>Funds & Withdrawals</strong> desk.
                </span>
              </div>
            </div>
          )}

          {activeTab === "SEGMENTS" && (
            <div className="profile-tab-content">
              <div className="profile-section-title">Trading Exchanges & Segments</div>
              <div className="segments-list">
                <div className="segment-row">
                  <div>
                    <strong>NSE Capital Market (Equity Cash)</strong>
                    <span>CNC, MIS, Intraday Stock Trading</span>
                  </div>
                  <span className="status-badge-active">ACTIVE</span>
                </div>
                <div className="segment-row">
                  <div>
                    <strong>BSE Capital Market (Equity Cash)</strong>
                    <span>CNC, MIS, SME & Sovereign Bonds</span>
                  </div>
                  <span className="status-badge-active">ACTIVE</span>
                </div>
                <div className="segment-row">
                  <div>
                    <strong>NSE Futures & Options (NFO)</strong>
                    <span>Index Options (Nifty, BankNifty), Stock Derivatives</span>
                  </div>
                  <span className="status-badge-active">ACTIVE</span>
                </div>
                <div className="segment-row">
                  <div>
                    <strong>MCX Commodity Derivatives</strong>
                    <span>Crude Oil, Natural Gas, Gold, Silver</span>
                  </div>
                  <span className="status-badge-inactive">OPTIONAL / INACTIVE</span>
                </div>
              </div>

              <div className="profile-divider-subtle"></div>

              <div className="profile-section-title">SEBI Demat Nomination</div>
              <div className="nominee-summary-card">
                <div>
                  <strong>Nominee Status: 100% Compliant</strong>
                  <span>Nominee added and verified in CDSL Demat registry</span>
                </div>
                {onOpenNominee && (
                  <button
                    type="button"
                    className="btn-view-nominee"
                    onClick={() => {
                      onClose();
                      onOpenNominee();
                    }}
                  >
                    View Nominee Details &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profile-modal-footer">
          <span className="profile-footer-subtext">Client Session Active &bull; IP 127.0.0.1</span>
          <button type="button" className="btn-profile-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientProfileModal;