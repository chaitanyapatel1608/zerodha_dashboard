import React, { useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import GeneralContext from "./GeneralContext";
import Funds from "./Funds";
import AddFundsModal from "./overlays/AddFundsModal";
import WithdrawFundsModal from "./overlays/WithdrawFundsModal";
import SegmentSettingsModal from "./overlays/SegmentSettingsModal";
import RmsPolicyModal from "./overlays/RmsPolicyModal";
import AccountStatusBanner from "./common/AccountStatusBanner";
import "./AccountPage.css";

const AccountPage = () => {
  const {
    currentUser,
    updateUser,
    logout,
    showToast,
    refreshPortfolio,
    openSupport,
  } = useContext(GeneralContext);

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "funds"
  const [showPan, setShowPan] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Modals
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isRmsModalOpen, setIsRmsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Available cash balance
  const [cashBalance, setCashBalance] = useState(1018428.31);

  const activeUserId = currentUser?.userId || "ZU9344";

  // Fetch live available margin for the hero card
  useEffect(() => {
    if (!activeUserId) return;
    axios
      .get(`${API_BASE}/userFunds`, { params: { userId: activeUserId } })
      .then((res) => {
        if (res.data?.equity?.availableMargin) {
          setCashBalance(Number(res.data.equity.availableMargin));
        }
      })
      .catch(() => {});
  }, [activeUserId]);

  // Privacy & theme
  const isPrivacy = Boolean(
    typeof currentUser?.isPrivacyMode !== "undefined"
      ? currentUser.isPrivacyMode
      : localStorage.getItem("zerodha_privacy") === "true"
  );

  const currentTheme = currentUser?.theme || localStorage.getItem("zerodha_theme") || "light";
  const isDark = currentTheme === "dark";

  const togglePrivacy = () => {
    updateUser({ isPrivacyMode: !isPrivacy });
    showToast(
      isPrivacy ? "Privacy Disabled" : "Privacy Enabled",
      isPrivacy ? "Account balances and P&L are now visible." : "Account balances and P&L are now hidden.",
      "info"
    );
  };

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    updateUser({ theme: newTheme });
    showToast("Theme Updated", `Switched to ${newTheme} mode.`, "info");
  };

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast("Copied to Clipboard", `${fieldName} copied successfully.`, "success");
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const rawPan = currentUser?.pan || "ABCDE1234F";
  const maskedPan = showPan ? rawPan : rawPan.slice(0, 2) + "•••••" + rawPan.slice(-2);
  const dematBoId = currentUser?.demat || "1208160012345678";

  return (
    <div className="account-page-container">
      {/* 1. Account Depository Status Banner */}
      <AccountStatusBanner
        message="Account status: CDSL Demat depository active. 2FA Biometric/TOTP enabled for compliance."
        linkText="View RMS policy"
        onLinkClick={() => setIsRmsModalOpen(true)}
      />

      {/* 2. 1-Tap Subtab Navigation (Profile & Settings • Funds & Margins) */}
      <div className="account-subtabs-nav" role="tablist" aria-label="Account Subtabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "profile"}
          className={`account-subtab-pill ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "6px" }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile & Settings</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "funds"}
          className={`account-subtab-pill ${activeTab === "funds" ? "active" : ""}`}
          onClick={() => setActiveTab("funds")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "6px" }}>
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Funds & Margins</span>
        </button>
      </div>

      {/* 3. Subtab Content: Funds & Margins */}
      {activeTab === "funds" && (
        <div className="account-funds-view">
          <Funds />
        </div>
      )}

      {/* 4. Subtab Content: Profile & Settings */}
      {activeTab === "profile" && (
        <div className="account-profile-view">
          {/* Identity Hero Card */}
          <div className="account-hero-card">
            <div className="account-hero-left">
              <div className="account-hero-avatar">
                {currentUser?.avatarText || "ZU"}
                <span className="avatar-online-dot" title="Session Active"></span>
              </div>
              <div className="account-hero-info">
                <div className="account-hero-name-row">
                  <h2 className="account-hero-name">{currentUser?.name || "Trader"}</h2>
                  <span className="account-id-badge">{activeUserId}</span>
                </div>
                <div className="account-hero-meta">
                  <span>{currentUser?.email || "trader@example.com"}</span>
                  <span className="meta-sep">&bull;</span>
                  <span>+91 ••••• ••892</span>
                </div>
                <div className="account-hero-status-row">
                  <span className="status-pill status-kyc">✓ SEBI KYC Verified</span>
                  <span className="status-pill status-resident">Resident Individual</span>
                  <span className="status-pill status-cdsl">CDSL Demat Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Margin Strip Card */}
          <div className="account-card margin-quick-card">
            <div className="margin-quick-left">
              <span className="card-kpi-label">Available Trading Margin</span>
              <div className="card-kpi-val text-green font-bold">
                {isPrivacy ? "••••••••" : `₹${cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <span className="card-kpi-sub">Instant zero-cost UPI pay-ins & 24/7 withdrawals</span>
            </div>
            <div className="margin-quick-actions">
              <button
                type="button"
                className="btn-margin-action btn-add-funds"
                onClick={() => setIsAddFundsOpen(true)}
              >
                + Add Funds
              </button>
              <button
                type="button"
                className="btn-margin-action btn-withdraw"
                onClick={() => setIsWithdrawOpen(true)}
              >
                Withdraw
              </button>
              <button
                type="button"
                className="btn-margin-action btn-view-ledger"
                onClick={() => setActiveTab("funds")}
              >
                Ledger &rarr;
              </button>
            </div>
          </div>

          {/* Demat & Identity Section */}
          <div className="account-card">
            <div className="account-card-header">
              <div className="card-header-title">
                <span className="header-icon">🪪</span>
                <h3>Demat & Regulatory Identity</h3>
              </div>
              <span className="badge-cdsl">CDSL Depository</span>
            </div>

            <div className="account-details-grid">
              <div className="detail-item">
                <span className="detail-label">16-Digit Demat BO ID</span>
                <div className="detail-value-row">
                  <span className="detail-val font-mono highlight-blue">{dematBoId}</span>
                  <button
                    type="button"
                    className="btn-copy-small"
                    onClick={() => handleCopy(dematBoId, "Demat BO ID")}
                    title="Copy 16-Digit BO ID"
                  >
                    {copiedField === "Demat BO ID" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Depository Participant (DP ID)</span>
                <span className="detail-val font-mono">12081600 (Zerodha Broking Ltd.)</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Income Tax PAN Number</span>
                <div className="detail-value-row">
                  <span className="detail-val font-mono">{maskedPan}</span>
                  <button
                    type="button"
                    className="btn-copy-small"
                    onClick={() => setShowPan(!showPan)}
                  >
                    {showPan ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Brokerage Tariff Plan</span>
                <span className="detail-val">Zerodha Free Equity Delivery (₹20 F&O)</span>
              </div>
            </div>
          </div>

          {/* Bank & Settlement Account */}
          <div className="account-card">
            <div className="account-card-header">
              <div className="card-header-title">
                <span className="header-icon">🏦</span>
                <h3>Primary Bank & Settlement Account</h3>
              </div>
              <span className="badge-verified">✓ NPCI Verified</span>
            </div>

            <div className="bank-hero-strip">
              <div className="bank-logo-box">HDFC</div>
              <div className="bank-text-box">
                <div className="bank-name-row">
                  <span className="bank-name">HDFC Bank Limited</span>
                  <span className="bank-account-pill">Primary Payout</span>
                </div>
                <div className="bank-numbers-row">
                  <span>A/c: <strong className="font-mono">••••••••••••4821</strong></span>
                  <span className="meta-sep">&bull;</span>
                  <span>IFSC: <strong className="font-mono">HDFC0000060</strong></span>
                  <span className="meta-sep">&bull;</span>
                  <span>Savings A/c</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Segments & Risk Controls */}
          <div className="account-card">
            <div className="account-card-header">
              <div className="card-header-title">
                <span className="header-icon">⚡</span>
                <h3>Trading Segments & Kill Switch</h3>
              </div>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setIsSegmentModalOpen(true)}
              >
                Manage Segments &rarr;
              </button>
            </div>

            <div className="segments-grid">
              <div className="segment-badge active">
                <span className="seg-dot green-dot"></span>
                <span className="seg-name">NSE Equity (CNC/MIS)</span>
              </div>
              <div className="segment-badge active">
                <span className="seg-dot green-dot"></span>
                <span className="seg-name">BSE Equity (CNC/MIS)</span>
              </div>
              <div className="segment-badge active">
                <span className="seg-dot green-dot"></span>
                <span className="seg-name">NSE F&O Derivatives</span>
              </div>
              <div className="segment-badge active">
                <span className="seg-dot green-dot"></span>
                <span className="seg-name">BSE F&O Derivatives</span>
              </div>
              <div className="segment-badge inactive">
                <span className="seg-dot grey-dot"></span>
                <span className="seg-name">MCX Commodity (Optional)</span>
              </div>
            </div>
          </div>

          {/* Terminal Preferences & Security */}
          <div className="account-card">
            <div className="account-card-header">
              <div className="card-header-title">
                <span className="header-icon">⚙️</span>
                <h3>Terminal Preferences & Privacy</h3>
              </div>
            </div>

            <div className="preferences-list">
              <div className="preference-item">
                <div className="pref-info">
                  <span className="pref-title">Privacy Mode</span>
                  <span className="pref-sub">Mask account balance, holding quantities, and P&L</span>
                </div>
                <label className="toggle-switch" aria-label="Toggle Privacy Mode">
                  <input
                    type="checkbox"
                    checked={isPrivacy}
                    onChange={togglePrivacy}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <div className="pref-info">
                  <span className="pref-title">Dark Theme</span>
                  <span className="pref-sub">Switch interface to high-contrast dark trading terminal</span>
                </div>
                <label className="toggle-switch" aria-label="Toggle Dark Theme">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item" onClick={() => setIsRmsModalOpen(true)} style={{ cursor: "pointer" }}>
                <div className="pref-info">
                  <span className="pref-title">Risk Management System (RMS) Policy</span>
                  <span className="pref-sub">Square-off cutoffs, call & trade fees, and peak leverage rules</span>
                </div>
                <span className="pref-arrow">&rarr;</span>
              </div>
            </div>
          </div>

          {/* Zerodha Ecosystem & External Portals */}
          <div className="account-card">
            <div className="account-card-header">
              <div className="card-header-title">
                <span className="header-icon">🌐</span>
                <h3>Zerodha Ecosystem & Reports</h3>
              </div>
            </div>

            <div className="ecosystem-grid">
              <a
                href="https://console.zerodha.com"
                target="_blank"
                rel="noreferrer"
                className="ecosystem-box"
              >
                <div className="eco-icon blue-bg">📊</div>
                <div className="eco-text">
                  <span className="eco-title">Console</span>
                  <span className="eco-sub">Tax P&L, tradebook & reports</span>
                </div>
              </a>

              <a
                href="https://coin.zerodha.com"
                target="_blank"
                rel="noreferrer"
                className="ecosystem-box"
              >
                <div className="eco-icon green-bg">🪙</div>
                <div className="eco-text">
                  <span className="eco-title">Coin</span>
                  <span className="eco-sub">Direct mutual funds & SIPs</span>
                </div>
              </a>

              <div
                className="ecosystem-box"
                onClick={() => {
                  if (openSupport) openSupport();
                  else window.open("https://support.zerodha.com", "_blank");
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="eco-icon purple-bg">💬</div>
                <div className="eco-text">
                  <span className="eco-title">Support Portal</span>
                  <span className="eco-sub">Create tickets & knowledgebase</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Logout Tray */}
          <div className="account-logout-section">
            <button
              type="button"
              className="btn-account-logout"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "8px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Log out of Kite ({activeUserId})</span>
            </button>
            <span className="logout-compliance-text">
              Zerodha Broking Limited &bull; Member: NSE/BSE/MCX &bull; SEBI Reg No. INZ000031633
            </span>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Funds Modal */}
      {isAddFundsOpen && (
        <AddFundsModal
          isOpen={isAddFundsOpen}
          onClose={() => setIsAddFundsOpen(false)}
          onSuccess={() => {
            refreshPortfolio();
            showToast("Funds Added", "Amount credited instantly to your trading margin.", "success");
          }}
          currentUser={currentUser}
        />
      )}

      {/* MODAL 2: Withdraw Funds Modal */}
      {isWithdrawOpen && (
        <WithdrawFundsModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={() => {
            refreshPortfolio();
            showToast("Payout Requested", "Withdrawal submitted for settlement.", "info");
          }}
          currentUser={currentUser}
        />
      )}

      {/* MODAL 3: Segment Settings Modal */}
      {isSegmentModalOpen && (
        <SegmentSettingsModal
          isOpen={isSegmentModalOpen}
          onClose={() => setIsSegmentModalOpen(false)}
          currentUser={currentUser}
          onSegmentUpdated={() => refreshPortfolio()}
        />
      )}

      {/* MODAL 4: RMS Policy Modal */}
      {isRmsModalOpen && (
        <RmsPolicyModal
          isOpen={isRmsModalOpen}
          onClose={() => setIsRmsModalOpen(false)}
        />
      )}

      {/* MODAL 5: Custom In-App Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="ipo-modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="ipo-modal-container ipo-confirm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsLogoutModalOpen(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="confirm-modal-body">
              <h3 className="confirm-title">Log out of Zerodha Kite?</h3>
              <p className="confirm-desc">
                Are you sure you want to end your active session for <strong>{currentUser?.name || "Trader"}</strong> ({activeUserId})?
              </p>

              <div className="confirm-impact-card">
                <div className="impact-item">
                  <span className="impact-bullet">🔒</span>
                  <div>
                    <strong>Secure Session Termination:</strong> Your trading session token will be cleared and biometrics locked.
                  </div>
                </div>
                <div className="impact-item">
                  <span className="impact-bullet">📈</span>
                  <div>
                    <strong>Active Orders & Positions:</strong> All live GTT, orders, and Demat holdings remain intact and continue trading on the exchange.
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-modal-footer">
              <button
                type="button"
                className="btn-confirm-keep"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="btn-confirm-revoke"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  if (logout) logout();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
