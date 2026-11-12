import React from "react";
import "./InviteFriendsModal.css";

const InviteFriendsModal = ({ isOpen, onClose, currentUser, showToast }) => {
  if (!isOpen) return null;

  const referralCode = currentUser?.userId || "ZU9344";
  const referralLink = `https://kite.zerodha.com/refer/${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    if (showToast) {
      showToast("Referral Link Copied", "Share this link with your friends to earn 10% brokerage sharing for lifetime!", "success");
    }
  };

  return (
    <div className="invite-modal-backdrop" onClick={onClose}>
      <div className="invite-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="invite-modal-header">
          <div>
            <span className="invite-badge">REWARDS & PARTNERSHIP</span>
            <h3 className="invite-title">Invite Friends & Earn Rewards</h3>
            <span className="invite-subtitle">Earn 10% of brokerage paid by your friends for life</span>
          </div>
          <button className="invite-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="invite-modal-body">
          {/* Top Reward Points Banner */}
          <div className="invite-points-card">
            <div>
              <span className="points-label">Your Reward Points</span>
              <div className="points-val">300 <span className="points-pts">Pts</span></div>
            </div>
            <div className="points-desc">
              Redeemable for Smallcase, Sensibull, and Streak premium memberships.
            </div>
          </div>

          {/* Referral Code & Copy Link */}
          <div className="referral-box">
            <label>Your Personal Referral Link</label>
            <div className="link-copy-row">
              <input type="text" readOnly value={referralLink} className="input-referral-link" />
              <button type="button" className="btn-copy-link" onClick={handleCopyLink}>
                📋 Copy Link
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="how-it-works-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <strong>Share Link</strong>
              <span>Send your unique link or referral code {referralCode} to your friends.</span>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <strong>Friends Onboard</strong>
              <span>They complete instant online KYC and open their Demat account.</span>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <strong>Earn Lifetime</strong>
              <span>Receive 300 reward points + 10% brokerage sharing directly every month.</span>
            </div>
          </div>
        </div>

        <div className="invite-modal-footer">
          <span className="invite-footer-info">SEBI Compliant Referral Partnership Program</span>
          <button type="button" className="btn-invite-close" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsModal;