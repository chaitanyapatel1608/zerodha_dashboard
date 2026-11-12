import React, { useState } from "react";
import "./ConsoleModal.css";

const MOCK_TRADES = [
  { id: "TRD-902184", time: "07 Nov, 09:32", symbol: "INFY", type: "BUY", product: "CNC", qty: 10, price: 1845.50, brokerage: 0 },
  { id: "TRD-889104", time: "06 Nov, 14:15", symbol: "RELIANCE", type: "BUY", product: "CNC", qty: 5, price: 2712.90, brokerage: 0 },
  { id: "TRD-874211", time: "05 Nov, 11:20", symbol: "NIFTY 24400 CE", type: "BUY", product: "MIS", qty: 50, price: 124.50, brokerage: 20 },
  { id: "TRD-874299", time: "05 Nov, 13:45", symbol: "NIFTY 24400 CE", type: "SELL", product: "MIS", qty: 50, price: 158.20, brokerage: 20 },
  { id: "TRD-861092", time: "04 Nov, 10:05", symbol: "TCS", type: "BUY", product: "CNC", qty: 2, price: 3982.75, brokerage: 0 },
];

const ConsoleModal = ({ isOpen, onClose, showToast }) => {
  const [activeTab, setActiveTab] = useState("TAX");

  if (!isOpen) return null;

  const handleDownload = (filename, type) => {
    if (showToast) {
      showToast("Download Started", `${filename} is being generated and downloaded.`, "success");
    }
    // Trigger synthetic file download
    const blob = new Blob([`Zerodha Console Statement\nAccount: ZU9344\nGenerated: ${new Date().toISOString()}\nType: ${type}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="console-modal-backdrop" onClick={onClose}>
      <div className="console-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="console-modal-header">
          <div className="console-header-left">
            <div className="console-logo-row">
              <span className="console-brand-icon">📊</span>
              <h3 className="console-title">Console</h3>
              <span className="console-badge">REPORTS & ANALYTICS</span>
            </div>
            <span className="console-subtitle">Tax P&L, Tradebook logs, and Exchange Contract Notes</span>
          </div>
          <button className="console-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Tab Bar */}
        <div className="console-tabs">
          <button
            type="button"
            className={`console-tab-btn ${activeTab === "TAX" ? "active" : ""}`}
            onClick={() => setActiveTab("TAX")}
          >
            Tax P&L (FY 2026-27)
          </button>
          <button
            type="button"
            className={`console-tab-btn ${activeTab === "TRADEBOOK" ? "active" : ""}`}
            onClick={() => setActiveTab("TRADEBOOK")}
          >
            Tradebook (Executions)
          </button>
          <button
            type="button"
            className={`console-tab-btn ${activeTab === "DOWNLOADS" ? "active" : ""}`}
            onClick={() => setActiveTab("DOWNLOADS")}
          >
            Contract Notes & Downloads
          </button>
        </div>

        {/* Body Content */}
        <div className="console-modal-body">
          {activeTab === "TAX" && (
            <div className="console-tab-content">
              <div className="tax-summary-cards">
                <div className="tax-card">
                  <span className="tax-card-label">Realized Equity Delivery (LTCG / STCG)</span>
                  <span className="tax-card-val text-green">+₹48,290.00</span>
                  <span className="tax-card-sub">Holding period &gt; 365 days</span>
                </div>
                <div className="tax-card">
                  <span className="tax-card-label">Realized Derivatives (F&O)</span>
                  <span className="tax-card-val text-green">+₹16,850.00</span>
                  <span className="tax-card-sub">Non-speculative business income</span>
                </div>
                <div className="tax-card">
                  <span className="tax-card-label">Statutory Charges & Taxes</span>
                  <span className="tax-card-val text-muted">-₹1,420.50</span>
                  <span className="tax-card-sub">STT, GST, Stamp Duty, SEBI</span>
                </div>
                <div className="tax-card highlight-border">
                  <span className="tax-card-label">Net Realized Profit</span>
                  <span className="tax-card-val font-bold text-green">+₹63,719.50</span>
                  <span className="tax-card-sub">After all exchange deductions</span>
                </div>
              </div>

              <div className="console-policy-note">
                <span>📜 Tax Note:</span> Long Term Capital Gains (LTCG) above ₹1.25 Lakh per financial year are taxed at 12.5% under Section 112A. Short Term Capital Gains (STCG) are taxed at 20% under Section 111A.
              </div>
            </div>
          )}

          {activeTab === "TRADEBOOK" && (
            <div className="console-tab-content">
              <div className="tradebook-table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Trade ID</th>
                      <th>Time</th>
                      <th>Instrument</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Brokerage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRADES.map((t) => (
                      <tr key={t.id}>
                        <td className="font-mono">{t.id}</td>
                        <td className="text-muted">{t.time}</td>
                        <td><strong>{t.symbol}</strong></td>
                        <td>
                          <span className={`trade-badge ${t.type.toLowerCase()}`}>{t.type}</span>
                        </td>
                        <td>{t.product}</td>
                        <td>{t.qty}</td>
                        <td>₹{t.price.toFixed(2)}</td>
                        <td>{t.brokerage === 0 ? <span className="free-badge">FREE</span> : `₹${t.brokerage}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "DOWNLOADS" && (
            <div className="console-tab-content">
              <div className="downloads-grid">
                <div className="download-item-card">
                  <div>
                    <strong>Electronic Contract Note (ECN)</strong>
                    <span>Daily official trade confirmation with digital exchange signature.</span>
                  </div>
                  <button
                    type="button"
                    className="btn-console-download"
                    onClick={() => handleDownload("Contract_Note_07Nov2026.pdf", "PDF")}
                  >
                    📄 Download PDF
                  </button>
                </div>

                <div className="download-item-card">
                  <div>
                    <strong>Tax P&L Statement (FY 2026-27)</strong>
                    <span>Audited capital gains breakdown formatted for ITR filing.</span>
                  </div>
                  <button
                    type="button"
                    className="btn-console-download"
                    onClick={() => handleDownload("Tax_PnL_FY2026_27.xlsx", "Excel")}
                  >
                    📊 Download Excel (.xlsx)
                  </button>
                </div>

                <div className="download-item-card">
                  <div>
                    <strong>Complete Financial Ledger</strong>
                    <span>Itemized ledger entries with payins, payouts, and margin credits.</span>
                  </div>
                  <button
                    type="button"
                    className="btn-console-download"
                    onClick={() => handleDownload("Financial_Ledger_2026.csv", "CSV")}
                  >
                    📑 Download CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="console-modal-footer">
          <span className="console-footer-info">Audited by Zerodha Compliance Engine</span>
          <button type="button" className="btn-console-close" onClick={onClose}>
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsoleModal;