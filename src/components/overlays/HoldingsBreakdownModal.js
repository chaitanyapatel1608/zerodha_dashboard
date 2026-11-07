import React from "react";
import "./HoldingsBreakdownModal.css";

const ISIN_MAP = {
  INFY: "INE009A01021",
  RELIANCE: "INE002A01018",
  HDFCBANK: "INE040A01034",
  TCS: "INE467B01029",
  TATAMOTORS: "INE155A01022",
  ICICIBANK: "INE090A01021",
  SBIN: "INE062A01020",
  BHARTIARTL: "INE397D01024",
  ITC: "INE154A01025",
  WIPRO: "INE075A01022",
  ADANIPORTS: "INE742F01042",
  NIFTYBEES: "INF732E01015",
  JUNIORBEES: "INF732E01049",
  ZOMATO: "INE758T01015",
};

const HoldingsBreakdownModal = ({ isOpen, onClose, holding, quote }) => {
  if (!isOpen || !holding) return null;

  const symbol = (holding.instrument || holding.name || "").toUpperCase();
  const isin = ISIN_MAP[symbol] || `INE${Math.floor(100000000 + Math.random() * 900000000)}`;
  const qty = Number(holding.qty || 0);
  const avgCost = Number(holding.avgCost || holding.avg || 0);
  const ltp = quote ? quote.price : Number(holding.ltp || holding.price || avgCost);
  const curVal = ltp * qty;
  const invested = avgCost * qty;
  const pnl = curVal - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  // Generate simulated purchase tranches based on total quantity
  const tranche1Qty = Math.ceil(qty * 0.6);
  const tranche2Qty = Math.max(0, qty - tranche1Qty);

  return (
    <div className="breakdown-modal-backdrop" onClick={onClose}>
      <div className="breakdown-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="breakdown-modal-header">
          <div>
            <div className="breakdown-title-row">
              <h3>{symbol}</h3>
              <span className="breakdown-isin-badge">{isin}</span>
            </div>
            <p className="breakdown-subtitle">Demat Holding Ledger & Tax Lots</p>
          </div>
          <button className="breakdown-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="breakdown-modal-body">
          {/* Top Metrics Strip */}
          <div className="breakdown-metrics-grid">
            <div className="breakdown-metric-box">
              <span className="metric-title">Demat Quantity</span>
              <span className="metric-val">{qty} Shares</span>
              <span className="metric-hint">Free & Pledged: 0</span>
            </div>
            <div className="breakdown-metric-box">
              <span className="metric-title">Average Cost</span>
              <span className="metric-val">₹{avgCost.toFixed(2)}</span>
              <span className="metric-hint">Invested: ₹{invested.toFixed(2)}</span>
            </div>
            <div className="breakdown-metric-box">
              <span className="metric-title">Market LTP</span>
              <span className="metric-val">₹{ltp.toFixed(2)}</span>
              <span className="metric-hint">Current: ₹{curVal.toFixed(2)}</span>
            </div>
            <div className="breakdown-metric-box">
              <span className="metric-title">Total Unrealized P&L</span>
              <span className={`metric-val ${pnl >= 0 ? "text-success" : "text-danger"}`}>
                {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
              </span>
              <span className={`metric-hint ${pnl >= 0 ? "text-success" : "text-danger"}`}>
                {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Tax Lots Tranches Table */}
          <div className="breakdown-lots-section">
            <h4>Demat Purchase Tranches (FIFO Tax Lots)</h4>
            <table className="breakdown-lots-table">
              <thead>
                <tr>
                  <th>Purchase Date</th>
                  <th>Quantity</th>
                  <th>Trade Price</th>
                  <th>Holding Period</th>
                  <th>Tax Status</th>
                  <th>Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>14 Feb 2025</td>
                  <td>{tranche1Qty}</td>
                  <td>₹{(avgCost * 0.98).toFixed(2)}</td>
                  <td>&gt; 365 Days</td>
                  <td>
                    <span className="tax-badge ltcg">LTCG (12.5%)</span>
                  </td>
                  <td className="text-success">
                    +₹{((ltp - avgCost * 0.98) * tranche1Qty).toFixed(2)}
                  </td>
                </tr>
                {tranche2Qty > 0 && (
                  <tr>
                    <td>28 Jul 2026</td>
                    <td>{tranche2Qty}</td>
                    <td>₹{(avgCost * 1.03).toFixed(2)}</td>
                    <td>&lt; 365 Days</td>
                    <td>
                      <span className="tax-badge stcg">STCG (20%)</span>
                    </td>
                    <td className={ltp >= avgCost * 1.03 ? "text-success" : "text-danger"}>
                      {ltp >= avgCost * 1.03 ? "+" : ""}₹{((ltp - avgCost * 1.03) * tranche2Qty).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Depository Holding Information */}
          <div className="depository-info-card">
            <span className="dep-icon">🏛️</span>
            <div>
              <strong>CDSL Depository Registration:</strong>
              <p>
                All {qty} shares of {symbol} are held in dematerialized electronic form in your CDSL Demat account and eligible for dividend payouts and corporate actions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="breakdown-modal-footer">
          <button type="button" className="btn-breakdown-done" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoldingsBreakdownModal;
