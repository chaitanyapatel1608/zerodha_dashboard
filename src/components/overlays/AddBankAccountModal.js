import React, { useState } from "react";
import axios from "axios";
import "./AddBankAccountModal.css";

import { API_BASE, AUTH_PORTAL_URL } from "../../config/api";

const POPULAR_BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "IndusInd Bank",
  "Federal Bank",
  "Other Bank",
];

const AddBankAccountModal = ({
  onClose,
  onSuccess,
  currentUser,
  showToast,
}) => {
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [customBankName, setCustomBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branch, setBranch] = useState("");
  const [accountType, setAccountType] = useState("SAVINGS");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const finalBankName = selectedBank === "Other Bank" ? customBankName.trim() : selectedBank;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!finalBankName) {
      setErrorMsg("Please select or enter your bank name.");
      return;
    }

    const cleanAcc = accountNumber.trim();
    const cleanConfirm = confirmAccountNumber.trim();

    if (!cleanAcc || cleanAcc.length < 8) {
      setErrorMsg("Please enter a valid account number (minimum 8 digits).");
      return;
    }

    if (cleanAcc !== cleanConfirm) {
      setErrorMsg("Account numbers do not match. Please verify.");
      return;
    }

    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      setErrorMsg("Please enter a valid 11-character IFSC code (e.g., HDFC0000060).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUser?.userId || "ZU9344",
        bankName: finalBankName,
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
        branch: branch.trim() || "Main Branch",
        accountType,
        isPrimary,
      };

      const res = await axios.post(`${API_BASE}/addBankAccount`, payload);

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Bank Account Linked",
            `Successfully verified ${finalBankName} (${res.data.account.maskedAccountNumber}) via NPCI Penny-Drop.`,
            "success"
          );
        }
        if (onSuccess) {
          onSuccess(res.data.account);
        }
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to link bank account.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to link bank account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="funds-modal-backdrop" onClick={onClose}>
      <div className="funds-modal-box add-bank-box" onClick={(e) => e.stopPropagation()}>
        <div className="funds-modal-header">
          <div>
            <div className="funds-badge-row">
              <span className="funds-tag-pill" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                ✓ NPCI Penny-Drop
              </span>
              <span className="funds-time-pill">🔒 Instant Verification</span>
            </div>
            <h3 className="funds-modal-title">Link New Bank Account</h3>
            <span className="funds-modal-subtitle">
              Add a verified bank account for margin withdrawals and automated payouts
            </span>
          </div>
          <button className="funds-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {errorMsg && <div className="funds-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="funds-form">
          {/* Bank Selection */}
          <div className="funds-form-group">
            <label>Select Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="select-bank-field"
            >
              {POPULAR_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {selectedBank === "Other Bank" && (
            <div className="funds-form-group">
              <label>Enter Bank Name</label>
              <input
                type="text"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                className="input-text-field"
                placeholder="e.g. Canara Bank, Union Bank"
                required
              />
            </div>
          )}

          {/* Account Number & Confirm */}
          <div className="form-row-two-col">
            <div className="funds-form-group">
              <label>Account Number</label>
              <input
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                className="input-text-field"
                placeholder="Enter account number"
                maxLength="20"
                required
              />
            </div>
            <div className="funds-form-group">
              <label>Confirm Account Number</label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                className={`input-text-field ${
                  confirmAccountNumber && confirmAccountNumber !== accountNumber
                    ? "input-error"
                    : confirmAccountNumber && confirmAccountNumber === accountNumber
                    ? "input-valid"
                    : ""
                }`}
                placeholder="Re-enter account number"
                maxLength="20"
                required
              />
            </div>
          </div>

          {/* IFSC Code & Branch */}
          <div className="form-row-two-col">
            <div className="funds-form-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="input-text-field"
                placeholder="e.g. HDFC0000060"
                maxLength="11"
                required
              />
            </div>
            <div className="funds-form-group">
              <label>Branch / City (Optional)</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="input-text-field"
                placeholder="e.g. Nariman Point, Mumbai"
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="funds-form-group">
            <label>Account Type</label>
            <div className="account-type-pills">
              <button
                type="button"
                className={`type-pill ${accountType === "SAVINGS" ? "active" : ""}`}
                onClick={() => setAccountType("SAVINGS")}
              >
                Savings Account
              </button>
              <button
                type="button"
                className={`type-pill ${accountType === "CURRENT" ? "active" : ""}`}
                onClick={() => setAccountType("CURRENT")}
              >
                Current Account
              </button>
            </div>
          </div>

          {/* Make Primary Checkbox */}
          <div className="checkbox-row-styled">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">
                Set as Primary Account (Default destination for future payouts)
              </span>
            </label>
          </div>

          {/* NPCI Penny-Drop Notice */}
          <div className="penny-drop-card">
            <div className="penny-drop-icon">🏦</div>
            <div className="penny-drop-text">
              <strong>Instant Penny-Drop Verification</strong>
              <span>
                As per SEBI regulations, a ₹1.00 credit will be sent via IMPS to verify your account holder name matches your PAN registry before activation.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="funds-modal-actions">
            <button type="button" className="btn-funds-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-funds-submit"
              style={{ background: "#059669" }}
              disabled={isSubmitting || !accountNumber || accountNumber !== confirmAccountNumber || !ifscCode}
            >
              {isSubmitting ? "Verifying with NPCI..." : "Link & Verify Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBankAccountModal;