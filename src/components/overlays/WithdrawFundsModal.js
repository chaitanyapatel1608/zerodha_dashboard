import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AddBankAccountModal from "./AddBankAccountModal";
import "./WithdrawFundsModal.css";

import { API_BASE, AUTH_PORTAL_URL } from "../../config/api";

const WithdrawFundsModal = ({
  onClose,
  onSuccess,
  currentUser,
  funds,
  showToast,
  refreshPortfolio,
}) => {
  const availableCashNum = parseFloat((funds?.equity?.availableCash || "0").replace(/,/g, "")) || 0;
  const [amount, setAmount] = useState(Math.min(availableCashNum, 5000));
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountsList, setBankAccountsList] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeUserId = currentUser?.userId || "ZU9344";

  // Fetch dynamic bank accounts from MongoDB
  const fetchBankAccounts = useCallback(async () => {
    try {
      setLoadingBanks(true);
      const res = await axios.get(`${API_BASE}/userBankAccounts`, {
        params: { userId: activeUserId },
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        setBankAccountsList(res.data);
        // Default to primary account, or the first account
        const primary = res.data.find((a) => a.isPrimary) || res.data[0];
        const valString = `${primary.bankName} ${primary.maskedAccountNumber}`;
        setBankAccount((prev) => prev || valString);
      } else {
        // Fallback default
        const fallbackAcc = {
          _id: "default-1",
          bankName: "HDFC Bank",
          maskedAccountNumber: "····4821",
          ifscCode: "HDFC0000060",
          isPrimary: true,
        };
        setBankAccountsList([fallbackAcc]);
        setBankAccount("HDFC Bank ····4821");
      }
    } catch (err) {
      console.warn("Could not fetch user bank accounts:", err.message);
      const fallbackAcc = {
        _id: "default-1",
        bankName: "HDFC Bank",
        maskedAccountNumber: "····4821",
        ifscCode: "HDFC0000060",
        isPrimary: true,
      };
      setBankAccountsList([fallbackAcc]);
      setBankAccount("HDFC Bank ····4821");
    } finally {
      setLoadingBanks(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const handleBankSelectChange = (e) => {
    const val = e.target.value;
    if (val === "__ADD_NEW__") {
      setShowAddBankModal(true);
    } else {
      setBankAccount(val);
    }
  };

  const handleBankAddedSuccess = (newAccount) => {
    fetchBankAccounts();
    if (newAccount) {
      setBankAccount(`${newAccount.bankName} ${newAccount.maskedAccountNumber}`);
    }
    setShowAddBankModal(false);
  };

  const handleSetPrimary = async (accountId) => {
    try {
      const res = await axios.put(`${API_BASE}/setPrimaryBankAccount/${accountId}`, {
        userId: activeUserId,
      });
      if (res.data?.success) {
        if (showToast) {
          showToast("Primary Account Updated", res.data.message, "success");
        }
        await fetchBankAccounts();
      }
    } catch (err) {
      if (showToast) {
        showToast("Error", err.response?.data?.message || err.message, "error");
      }
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm("Are you sure you want to unlink this bank account?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/deleteBankAccount/${accountId}`, {
        params: { userId: activeUserId },
      });
      if (res.data?.success) {
        if (showToast) {
          showToast("Account Unlinked", res.data.message, "success");
        }
        await fetchBankAccounts();
      }
    } catch (err) {
      if (showToast) {
        showToast("Error", err.response?.data?.message || err.message, "error");
      }
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (numAmount > availableCashNum) {
      setErrorMsg(`Withdrawal exceeds available cash balance of ₹${availableCashNum.toLocaleString("en-IN")}.`);
      return;
    }

    if (!bankAccount || bankAccount === "__ADD_NEW__") {
      setErrorMsg("Please select a verified bank account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/withdrawFunds`, {
        userId: activeUserId,
        amount: numAmount,
        bankAccount,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Withdrawal Requested",
            `₹${numAmount.toLocaleString("en-IN")} payout requested to ${bankAccount}.`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to process withdrawal.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to process withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccountObj = bankAccountsList.find(
    (a) => `${a.bankName} ${a.maskedAccountNumber}` === bankAccount
  );

  return (
    <>
      <div className="funds-modal-backdrop" onClick={onClose}>
        <div className="funds-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="funds-modal-header">
            <div>
              <div className="funds-badge-row">
                <span className="funds-tag-pill" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                  SEBI Standard Clearing
                </span>
                <span className="funds-time-pill">⏰ Payout Cut-off: 20:30 IST</span>
              </div>
              <h3 className="funds-modal-title">Withdraw Funds</h3>
              <span className="funds-modal-subtitle">Transfer funds from trading margin to your bank account</span>
            </div>
            <button className="funds-btn-close" onClick={onClose}>
              ✕
            </button>
          </div>

          {errorMsg && <div className="funds-error-banner">{errorMsg}</div>}

          {/* Available Cash Card */}
          <div className="withdrawable-cash-card">
            <div>
              <span className="withdrawable-label">Available Withdrawable Cash</span>
              <div className="withdrawable-amount">
                ₹{availableCashNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            {availableCashNum > 0 && (
              <button
                type="button"
                className="btn-withdraw-all"
                onClick={() => setAmount(availableCashNum)}
              >
                Withdraw All
              </button>
            )}
          </div>

          <form onSubmit={handleWithdraw} className="funds-form">
            <div className="funds-form-group">
              <label>Withdrawal Amount (₹)</label>
              <div className="amount-input-wrap">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  min="100"
                  max={availableCashNum}
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || "")}
                  className="input-amount-field"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            {/* Dynamic Bank Account Selection with Add Option */}
            <div className="funds-form-group">
              <div className="bank-account-label-row">
                <label>Verified Destination Bank Account</label>
                <button
                  type="button"
                  className="btn-add-bank-inline"
                  onClick={() => setShowAddBankModal(true)}
                >
                  + Add Bank Account
                </button>
              </div>

              {loadingBanks ? (
                <div style={{ fontSize: "13px", color: "#6b7280", padding: "8px 0" }}>
                  Loading linked bank accounts...
                </div>
              ) : (
                <select
                  value={bankAccount}
                  onChange={handleBankSelectChange}
                  className="select-bank-field"
                  required
                >
                  {bankAccountsList.map((acc) => (
                    <option
                      key={acc._id}
                      value={`${acc.bankName} ${acc.maskedAccountNumber}`}
                    >
                      {acc.bankName} {acc.maskedAccountNumber} (IFSC: {acc.ifscCode}) - {acc.isPrimary ? "Primary" : "Secondary"}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" style={{ fontWeight: 600, color: "#2563eb" }}>
                    + Add New Bank Account...
                  </option>
                </select>
              )}

              {selectedAccountObj && !selectedAccountObj.isPrimary && (
                <div className="selected-account-actions">
                  <span className="secondary-badge">Secondary Account</span>
                  <div className="account-action-buttons">
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={() => handleSetPrimary(selectedAccountObj._id)}
                    >
                      ★ Set as Primary
                    </button>
                    <button
                      type="button"
                      className="btn-link-action text-danger"
                      onClick={() => handleDeleteAccount(selectedAccountObj._id)}
                    >
                      🗑 Unlink
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clearing Policy Note */}
            <div className="clearing-policy-box">
              <div className="policy-row">
                <strong>Processing Timeline:</strong>
                <span>Requests placed before 20:30 IST are processed on the same business day and credited by 06:00 IST tomorrow.</span>
              </div>
              <div className="policy-row">
                <strong>SEBI Rule:</strong>
                <span>Unsettled intraday profits and T+1 delivery sell margins become withdrawable upon exchange settlement.</span>
              </div>
            </div>

            <div className="funds-modal-actions">
              <button type="button" className="btn-funds-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-funds-submit"
                style={{ background: "#2563eb" }}
                disabled={isSubmitting || availableCashNum <= 0 || amount > availableCashNum || !bankAccount}
              >
                {isSubmitting ? "Processing..." : `Withdraw ₹${Number(amount || 0).toLocaleString("en-IN")}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modal: Add New Bank Account */}
      {showAddBankModal && (
        <AddBankAccountModal
          onClose={() => setShowAddBankModal(false)}
          onSuccess={handleBankAddedSuccess}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default WithdrawFundsModal;