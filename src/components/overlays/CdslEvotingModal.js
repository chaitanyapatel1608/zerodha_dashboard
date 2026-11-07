import React, { useState } from "react";
import "./CdslEvotingModal.css";

const INITIAL_RESOLUTIONS = [
  {
    id: "RES-TCS-2026-01",
    company: "Tata Consultancy Services Ltd.",
    symbol: "TCS",
    isin: "INE467B01029",
    type: "Ordinary Resolution",
    title: "Approval of Final Dividend of ₹28.00 per Equity Share for FY26",
    votingPeriod: "01 Nov 2026 - 15 Nov 2026",
    status: "OPEN",
    userVote: null,
  },
  {
    id: "RES-INFY-2026-04",
    company: "Infosys Limited",
    symbol: "INFY",
    isin: "INE009A01021",
    type: "Special Resolution",
    title: "Re-appointment of Mr. D. Sundaram as Independent Director for a 2nd Term",
    votingPeriod: "05 Nov 2026 - 18 Nov 2026",
    status: "OPEN",
    userVote: null,
  },
  {
    id: "RES-ITC-2026-02",
    company: "ITC Limited",
    symbol: "ITC",
    isin: "INE154A01025",
    type: "Special Resolution",
    title: "Scheme of Demerger: Transfer of Hotel Business to ITC Hotels Ltd.",
    votingPeriod: "04 Nov 2026 - 20 Nov 2026",
    status: "OPEN",
    userVote: null,
  },
  {
    id: "RES-SBIN-2026-09",
    company: "State Bank of India",
    symbol: "SBIN",
    isin: "INE062A01020",
    type: "Ordinary Resolution",
    title: "Approval of Raising Capital via Basel III Compliant Additional Tier 1 Bonds",
    votingPeriod: "02 Nov 2026 - 16 Nov 2026",
    status: "OPEN",
    userVote: null,
  },
];

const CdslEvotingModal = ({ isOpen, onClose, userDemat, showToast = () => {} }) => {
  const [resolutions, setResolutions] = useState(INITIAL_RESOLUTIONS);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  if (!isOpen) return null;

  const boId = userDemat || "1208160012345678";

  const handleSelectOption = (resId, option) => {
    setSelectedVotes((prev) => ({ ...prev, [resId]: option }));
  };

  const handleCastVote = (resolution) => {
    const choice = selectedVotes[resolution.id];
    if (!choice) {
      showToast("Vote Required", "Please select FOR, AGAINST, or ABSTAIN before submitting.", "error");
      return;
    }

    setSubmittingId(resolution.id);
    setTimeout(() => {
      setResolutions((prev) =>
        prev.map((r) => (r.id === resolution.id ? { ...r, userVote: choice } : r))
      );
      setSubmittingId(null);
      showToast(
        "Vote Recorded Successfully",
        `Your vote (${choice}) for ${resolution.symbol} resolution has been recorded on CDSL depository ledger.`,
        "success"
      );
    }, 600);
  };

  return (
    <div className="evoting-modal-backdrop" onClick={onClose}>
      <div className="evoting-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="evoting-modal-header">
          <div className="evoting-brand-row">
            <span className="cdsl-evoting-logo">🗳️ CDSL e-Voting</span>
            <div>
              <h3>Shareholder Corporate Governance & e-Voting</h3>
              <p className="evoting-subtitle">
                Central Depository Services (India) Ltd. &bull; Demat BO ID: <strong>{boId}</strong>
              </p>
            </div>
          </div>
          <button className="evoting-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Info Banner */}
        <div className="evoting-info-banner">
          <span className="info-icon">ℹ</span>
          <span>
            Under SEBI Listing Regulations, every retail shareholder is entitled to vote on corporate resolutions for companies held in their Demat account on the record date.
          </span>
        </div>

        {/* Resolutions List */}
        <div className="evoting-body-list">
          {resolutions.map((res) => {
            const hasVoted = Boolean(res.userVote);
            const currentChoice = selectedVotes[res.id] || "";

            return (
              <div key={res.id} className={`evoting-resolution-card ${hasVoted ? "card-voted" : ""}`}>
                <div className="resolution-top-row">
                  <div className="company-info">
                    <span className="company-symbol">{res.symbol}</span>
                    <span className="company-name">{res.company}</span>
                    <span className="isin-tag">ISIN: {res.isin}</span>
                  </div>
                  <span className={`resolution-type-tag ${res.type.includes("Special") ? "type-special" : "type-ordinary"}`}>
                    {res.type}
                  </span>
                </div>

                <h5 className="resolution-title">{res.title}</h5>

                <div className="resolution-meta-row">
                  <span className="meta-item">
                    Event No: <strong>{res.id}</strong>
                  </span>
                  <span className="meta-dot">&bull;</span>
                  <span className="meta-item">
                    Voting Period: <strong>{res.votingPeriod}</strong>
                  </span>
                </div>

                {/* Vote Action Area */}
                <div className="resolution-action-box">
                  {hasVoted ? (
                    <div className="voted-confirmation-strip">
                      <span className="voted-check">✓</span>
                      <span>
                        You voted <strong>{res.userVote}</strong> on this resolution. CDSL Acknowledgement Receipt: <strong>{`REC-${res.id.slice(-6)}-ACK`}</strong>.
                      </span>
                    </div>
                  ) : (
                    <div className="vote-options-form">
                      <div className="vote-radio-group">
                        <label className={`radio-pill for ${currentChoice === "FOR" ? "selected" : ""}`}>
                          <input
                            type="radio"
                            name={`vote_${res.id}`}
                            value="FOR"
                            checked={currentChoice === "FOR"}
                            onChange={() => handleSelectOption(res.id, "FOR")}
                          />
                          <span>👍 FOR</span>
                        </label>
                        <label className={`radio-pill against ${currentChoice === "AGAINST" ? "selected" : ""}`}>
                          <input
                            type="radio"
                            name={`vote_${res.id}`}
                            value="AGAINST"
                            checked={currentChoice === "AGAINST"}
                            onChange={() => handleSelectOption(res.id, "AGAINST")}
                          />
                          <span>👎 AGAINST</span>
                        </label>
                        <label className={`radio-pill abstain ${currentChoice === "ABSTAIN" ? "selected" : ""}`}>
                          <input
                            type="radio"
                            name={`vote_${res.id}`}
                            value="ABSTAIN"
                            checked={currentChoice === "ABSTAIN"}
                            onChange={() => handleSelectOption(res.id, "ABSTAIN")}
                          />
                          <span>✋ ABSTAIN</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        className="btn-submit-evote"
                        disabled={submittingId === res.id || !currentChoice}
                        onClick={() => handleCastVote(res)}
                      >
                        {submittingId === res.id ? "Recording..." : "Cast E-Vote"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="evoting-modal-footer">
          <span className="footer-note">
            Electronic voting secured via CDSL Demat depository ledger &bull; 256-Bit SSL Encrypted
          </span>
          <button type="button" className="btn-evoting-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CdslEvotingModal;
