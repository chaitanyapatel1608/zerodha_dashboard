import React, { useState } from "react";
import "./CoinModal.css";

const COIN_FUNDS = [
  { id: "COIN-01", name: "UTI Nifty 50 Index Fund", category: "Index", nav: "₹184.20", cagr3Y: "16.8%", expenseRatio: "0.20%", minSip: 500, rating: "5★" },
  { id: "COIN-02", name: "Parag Parikh Flexi Cap Fund", category: "Equity", nav: "₹82.40", cagr3Y: "21.4%", expenseRatio: "0.62%", minSip: 1000, rating: "5★" },
  { id: "COIN-03", name: "Mirae Asset Large Cap Fund", category: "Equity", nav: "₹118.60", cagr3Y: "17.9%", expenseRatio: "0.54%", minSip: 500, rating: "4★" },
  { id: "COIN-04", name: "Mirae Asset ELSS Tax Saver", category: "ELSS", nav: "₹45.90", cagr3Y: "19.2%", expenseRatio: "0.58%", minSip: 500, rating: "5★" },
  { id: "COIN-05", name: "Nippon India Sovereign Gold ETF", category: "Gold", nav: "₹74.80", cagr3Y: "14.5%", expenseRatio: "0.25%", minSip: 100, rating: "4★" },
];

const CoinModal = ({ isOpen, onClose, showToast }) => {
  const [filter, setFilter] = useState("ALL");
  const [selectedFund, setSelectedFund] = useState(null);
  const [sipAmount, setSipAmount] = useState(1000);

  if (!isOpen) return null;

  const filtered = filter === "ALL" ? COIN_FUNDS : COIN_FUNDS.filter((f) => f.category === filter);

  const handleStartSip = (fund) => {
    if (showToast) {
      showToast(
        "Coin SIP Mandate Active",
        `Monthly SIP of ₹${sipAmount.toLocaleString("en-IN")} started in ${fund.name}. Next installment on 15th.`,
        "success"
      );
    }
    setSelectedFund(null);
  };

  return (
    <div className="coin-modal-backdrop" onClick={onClose}>
      <div className="coin-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="coin-modal-header">
          <div className="coin-header-left">
            <div className="coin-logo-row">
              <span className="coin-brand-icon">🪙</span>
              <h3 className="coin-title">Coin by Zerodha</h3>
              <span className="coin-badge">DIRECT MUTUAL FUNDS</span>
            </div>
            <span className="coin-subtitle">Zero commissions &bull; Direct growth NAVs &bull; Automated SIP mandates</span>
          </div>
          <button className="coin-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Filter Pills */}
        <div className="coin-filters">
          {["ALL", "Index", "Equity", "ELSS", "Gold"].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`coin-filter-pill ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat === "ALL" ? "All Direct Funds" : cat}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="coin-modal-body">
          <div className="coin-funds-list">
            {filtered.map((fund) => {
              const isSelected = selectedFund?.id === fund.id;
              return (
                <div key={fund.id} className={`coin-fund-card ${isSelected ? "selected" : ""}`}>
                  <div className="fund-card-main">
                    <div className="fund-info">
                      <div className="fund-name-row">
                        <strong>{fund.name}</strong>
                        <span className="fund-rating">{fund.rating}</span>
                        <span className="fund-category-pill">{fund.category}</span>
                      </div>
                      <div className="fund-metrics-row">
                        <span>NAV: <strong>{fund.nav}</strong></span>
                        <span>3Y CAGR: <strong className="text-green">{fund.cagr3Y}</strong></span>
                        <span>Expense: <strong>{fund.expenseRatio}</strong></span>
                        <span>Min SIP: <strong>₹{fund.minSip}</strong></span>
                      </div>
                    </div>
                    <div className="fund-card-action">
                      {isSelected ? (
                        <div className="fund-sip-form">
                          <div className="sip-input-wrap">
                            <span>₹</span>
                            <input
                              type="number"
                              min={fund.minSip}
                              step="500"
                              value={sipAmount}
                              onChange={(e) => setSipAmount(Number(e.target.value) || fund.minSip)}
                              className="input-sip-amount"
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-confirm-sip"
                            onClick={() => handleStartSip(fund)}
                          >
                            Confirm ₹{sipAmount}
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-sip"
                            onClick={() => setSelectedFund(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-open-sip"
                          onClick={() => {
                            setSelectedFund(fund);
                            setSipAmount(fund.minSip);
                          }}
                        >
                          + Start SIP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="coin-benefit-box">
            <span>💡 Zero Commission Advantage:</span> Direct mutual funds have lower expense ratios than regular plans, delivering up to 1.5% higher annual compounding returns over 15+ years.
          </div>
        </div>

        {/* Footer */}
        <div className="coin-modal-footer">
          <span className="coin-footer-info">SEBI Registered Mutual Fund Distributor: INA0000031633</span>
          <button type="button" className="btn-coin-close" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoinModal;