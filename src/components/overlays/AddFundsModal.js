import React, { useState } from "react";
import axios from "axios";
import "./AddFundsModal.css";

import { API_BASE, AUTH_PORTAL_URL } from "../../config/api";

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];
const UPI_SUFFIXES = ["@okhdfcbank", "@okaxis", "@oksbi", "@paytm", "@upi"];

const AddFundsModal = ({ onClose, onSuccess, currentUser, showToast, refreshPortfolio }) => {
  const [amount, setAmount] = useState(10000);
  const [upiUser, setUpiUser] = useState("");
  const [upiSuffix, setUpiSuffix] = useState("@okhdfcbank");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fullUpiId = upiUser.includes("@") ? upiUser.trim() : `${upiUser.trim()}${upiSuffix}`;
  const userEmail = currentUser?.email || "";

  const handleInitiate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!amount || amount <= 0) {
      setErrorMsg("Please enter a valid deposit amount.");
      return;
    }

    if (!upiUser.trim()) {
      setErrorMsg("Please enter your UPI ID handle.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/fundDeposit/initiate`, {
        userId: currentUser?.userId,
        amount: Number(amount),
        upiId: fullUpiId,
        userEmail,
      });

      if (res.data?.success) {
        setPendingTx(res.data);
        if (showToast) {
          showToast(
            "Demo deposit requested",
            res.data.message,
            "info"
          );
        }
      } else {
        setErrorMsg(res.data?.message || "Failed to initiate deposit.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to initiate deposit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="funds-modal-backdrop" onClick={onClose}>
      <div className="funds-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="funds-modal-header">
          <div>
            <div className="funds-badge-row">
              <span className="funds-tag-pill">Instant Zero-Cost Deposit</span>
              <span className="funds-time-pill">⚡ Real-Time UPI Margin</span>
            </div>
            <h3 className="funds-modal-title">Add Funds to Trading Account</h3>
            <span className="funds-modal-subtitle">Target Segment: Equity & F&O Margin</span>
          </div>
          <button className="funds-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {errorMsg && <div className="funds-error-banner">{errorMsg}</div>}

        {!pendingTx ? (
          <form onSubmit={handleInitiate} className="funds-form">
            {/* Amount Input */}
            <div className="funds-form-group">
              <label>Deposit Amount (₹)</label>
              <div className="amount-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || "")}
                  className="input-amount-field"
                  placeholder="Enter amount (min ₹100)"
                  required
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="quick-amounts-row">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`btn-quick-amount ${amount === val ? "active" : ""}`}
                    onClick={() => setAmount(val)}
                  >
                    +₹{val.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID Input */}
            <div className="funds-form-group">
              <label>Your UPI ID (Virtual Payment Address)</label>
              <div className="upi-input-wrap">
                <input
                  type="text"
                  value={upiUser}
                  onChange={(e) => setUpiUser(e.target.value)}
                  placeholder="e.g. 9876543210 or yourname"
                  className="input-upi-user"
                  required
                />
                {!upiUser.includes("@") && (
                  <select
                    value={upiSuffix}
                    onChange={(e) => setUpiSuffix(e.target.value)}
                    className="select-upi-suffix"
                  >
                    {UPI_SUFFIXES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <span className="field-hint">
                A collect request will be sent to <strong>{fullUpiId || "your UPI ID"}</strong>
              </span>
            </div>

            <div className="funds-modal-actions" style={{ marginTop: "24px" }}>
              <button type="button" className="btn-funds-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-funds-submit"
                disabled={isSubmitting || !amount || !upiUser.trim()}
              >
                {isSubmitting ? "Processing..." : `Add ₹${Number(amount || 0).toLocaleString("en-IN")}`}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation View */
          <div className="pending-approval-view">
            <div className="pending-icon-pulse">
              <div className="pulse-ring"></div>
              <span>⏳</span>
            </div>

            <h4 className="pending-title">UPI Collect Request Dispatched</h4>
            <p className="pending-desc">
              We have dispatched a payment collect request for{" "}
              <strong>₹{Number(amount).toLocaleString("en-IN")}</strong> to{" "}
              <strong>{fullUpiId}</strong>.
            </p>

            <div className="pending-details-box">
              <div className="pending-detail-row">
                <span>Reference ID</span>
                <strong style={{ fontFamily: "monospace" }}>{pendingTx.transaction?.referenceId}</strong>
              </div>
              <div className="pending-detail-row">
                <span>Payer UPI ID</span>
                <strong>{fullUpiId}</strong>
              </div>
              <div className="pending-detail-row">
                <span>Status</span>
                <span className="badge-pending">PENDING APPROVAL</span>
              </div>
            </div>

            <p className="check-email-note">
              {pendingTx.delivered === false ? "Email delivery failed. Use Resend email in the funds history for" : "Open the email sent to"} (<strong>{userEmail}</strong>) and click <strong>"Approve Payment"</strong>. Sign in to the same account and confirm the simulated deposit.
            </p>

            <div className="funds-modal-actions" style={{ marginTop: "16px", justifyContent: "center" }}>
              <button type="button" className="btn-funds-cancel" onClick={onClose} style={{ minWidth: "140px" }}>
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFundsModal;
