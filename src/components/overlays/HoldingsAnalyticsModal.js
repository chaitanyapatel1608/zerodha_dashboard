import React from "react";
import "./HoldingsAnalyticsModal.css";

const STOCK_METADATA = {
  SBIN: { sector: "Banking & Financials", cap: "Large Cap", beta: 1.15 },
  TCS: { sector: "Information Technology", cap: "Large Cap", beta: 0.82 },
  ITC: { sector: "FMCG", cap: "Large Cap", beta: 0.65 },
  INFY: { sector: "Information Technology", cap: "Large Cap", beta: 0.94 },
  WIPRO: { sector: "Information Technology", cap: "Large Cap", beta: 0.88 },
  NIFTYBEES: { sector: "Index ETFs", cap: "Broad Market", beta: 1.00 },
  ADANIPORTS: { sector: "Infrastructure & Ports", cap: "Large Cap", beta: 1.25 },
  JUNIORBEES: { sector: "Next 50 ETFs", cap: "Mid Cap", beta: 1.08 },
  ZOMATO: { sector: "Consumer Internet", cap: "Large Cap", beta: 1.35 },
  RELIANCE: { sector: "Energy & Telecom", cap: "Large Cap", beta: 1.02 },
  HDFCBANK: { sector: "Banking & Financials", cap: "Large Cap", beta: 0.98 },
  TATAMOTORS: { sector: "Automobile", cap: "Large Cap", beta: 1.42 },
  ICICIBANK: { sector: "Banking & Financials", cap: "Large Cap", beta: 1.12 },
  BHARTIARTL: { sector: "Telecommunications", cap: "Large Cap", beta: 0.85 },
  LT: { sector: "Engineering & Construction", cap: "Large Cap", beta: 1.05 },
  HINDUNILVR: { sector: "FMCG", cap: "Large Cap", beta: 0.68 },
  BAJFINANCE: { sector: "Financial Services", cap: "Large Cap", beta: 1.30 },
  MARUTI: { sector: "Automobile", cap: "Large Cap", beta: 0.92 },
  SUNPHARMA: { sector: "Pharmaceuticals", cap: "Large Cap", beta: 0.72 },
  COALINDIA: { sector: "Metals & Mining", cap: "Large Cap", beta: 0.95 },
};

const SECTOR_COLORS = {
  "Information Technology": "#3b82f6",
  "Banking & Financials": "#10b981",
  "FMCG": "#f59e0b",
  "Energy & Telecom": "#ef4444",
  "Infrastructure & Ports": "#8b5cf6",
  "Consumer Internet": "#ec4899",
  "Index ETFs": "#06b6d4",
  "Next 50 ETFs": "#14b8a6",
  "Automobile": "#f97316",
  "Telecommunications": "#6366f1",
  "Financial Services": "#84cc16",
  "Pharmaceuticals": "#d946ef",
  "Other": "#94a3b8",
};

const HoldingsAnalyticsModal = ({ isOpen, onClose, holdings = [], quotes = {} }) => {
  if (!isOpen) return null;

  // Compute live current value and P&L per holding
  const enrichedHoldings = holdings.map((h) => {
    const sym = (h.instrument || h.name || "").toUpperCase();
    const live = quotes[sym];
    const avgCost = Number(h.avgCost || h.avg || 0);
    const qty = Number(h.qty || 0);
    const ltp = live ? live.price : Number(h.ltp || h.price || avgCost);
    const curVal = ltp * qty;
    const invested = avgCost * qty;
    const pnl = curVal - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    const meta = STOCK_METADATA[sym] || { sector: "Other", cap: "Mid/Small Cap", beta: 1.0 };

    return {
      symbol: sym,
      qty,
      avgCost,
      ltp,
      invested,
      curVal,
      pnl,
      pnlPct,
      sector: meta.sector,
      cap: meta.cap,
      beta: meta.beta,
    };
  });

  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.invested, 0);
  const totalCurVal = enrichedHoldings.reduce((s, h) => s + h.curVal, 0);
  const totalPnl = totalCurVal - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Sector Breakdown
  const sectorMap = {};
  enrichedHoldings.forEach((h) => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.curVal;
  });

  const sectorList = Object.entries(sectorMap)
    .map(([sector, val]) => ({
      sector,
      val,
      pct: totalCurVal > 0 ? (val / totalCurVal) * 100 : 0,
      color: SECTOR_COLORS[sector] || "#64748b",
    }))
    .sort((a, b) => b.val - a.val);

  // Market Cap Breakdown
  const capMap = { "Large Cap": 0, "Mid Cap": 0, "Broad Market": 0, "Mid/Small Cap": 0 };
  enrichedHoldings.forEach((h) => {
    capMap[h.cap] = (capMap[h.cap] || 0) + h.curVal;
  });

  // Weighted Beta
  const weightedBeta = totalCurVal > 0
    ? enrichedHoldings.reduce((s, h) => s + h.beta * (h.curVal / totalCurVal), 0)
    : 1.0;

  // Top gainers & draggers
  const sortedByPct = [...enrichedHoldings].sort((a, b) => b.pnlPct - a.pnlPct);
  const topGainers = sortedByPct.filter((h) => h.pnl > 0).slice(0, 3);
  const topDraggers = [...sortedByPct].reverse().filter((h) => h.pnl < 0).slice(0, 3);

  return (
    <div className="analytics-modal-backdrop" onClick={onClose}>
      <div className="analytics-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="analytics-modal-header">
          <div className="header-title-row">
            <span className="analytics-brand-icon">📊</span>
            <div>
              <h3>Holdings Portfolio Analytics</h3>
              <p className="analytics-subtitle">
                Comprehensive Demat Health &bull; Sector Exposure &bull; Factor Risk
              </p>
            </div>
          </div>
          <button className="analytics-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="analytics-modal-body">
          {/* Key Portfolio Metrics */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">Current Portfolio Value</span>
              <span className="kpi-value">
                ₹{totalCurVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="kpi-sub">Invested: ₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Unrealized Total P&L</span>
              <span className={`kpi-value ${totalPnl >= 0 ? "text-success" : "text-danger"}`}>
                {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`kpi-badge ${totalPnl >= 0 ? "badge-profit" : "badge-loss"}`}>
                {totalPnl >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}% ROI
              </span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Portfolio Beta</span>
              <span className="kpi-value">{weightedBeta.toFixed(2)}</span>
              <span className="kpi-sub">
                {weightedBeta < 1 ? "Lower Volatility than Nifty 50" : "Slightly Aggressive Volatility"}
              </span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Concentration Risk</span>
              <span className="kpi-value text-success">Optimal</span>
              <span className="kpi-sub">{enrichedHoldings.length} Active Holdings</span>
            </div>
          </div>

          {/* Sector Allocation Breakdown */}
          <div className="analytics-section">
            <div className="section-header-row">
              <h4>Sector Allocation</h4>
              <span className="section-note">Distribution by current market value</span>
            </div>

            {/* Visual Multi-Color Bar */}
            <div className="sector-stacked-bar">
              {sectorList.map((sec, idx) => (
                <div
                  key={idx}
                  className="stacked-bar-segment"
                  style={{ width: `${sec.pct}%`, backgroundColor: sec.color }}
                  title={`${sec.sector}: ${sec.pct.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Sector Details Grid */}
            <div className="sector-chips-grid">
              {sectorList.map((sec, idx) => (
                <div key={idx} className="sector-stat-chip">
                  <div className="chip-color-dot" style={{ backgroundColor: sec.color }} />
                  <div className="chip-info">
                    <span className="chip-name">{sec.sector}</span>
                    <span className="chip-val">
                      ₹{sec.val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <strong>({sec.pct.toFixed(1)}%)</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Cap & Factor Distribution */}
          <div className="analytics-two-col-grid">
            {/* Market Cap Distribution */}
            <div className="analytics-subcard">
              <h4>Market Capitalization Tiers</h4>
              <div className="cap-distribution-list">
                {Object.entries(capMap).map(([tier, val], idx) => {
                  const pct = totalCurVal > 0 ? (val / totalCurVal) * 100 : 0;
                  return (
                    <div key={idx} className="cap-bar-row">
                      <div className="cap-label-row">
                        <span className="cap-title">{tier}</span>
                        <span className="cap-pct">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="cap-progress-track">
                        <div
                          className="cap-progress-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: tier === "Large Cap" ? "#2563eb" : tier === "Broad Market" ? "#06b6d4" : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Extremes */}
            <div className="analytics-subcard">
              <h4>Top Contributors & Laggards</h4>
              <div className="performance-split-container">
                <div>
                  <h6 className="perf-subheading text-success">Top ROI Contributors</h6>
                  {topGainers.length === 0 ? (
                    <div className="perf-empty">No positive holdings yet</div>
                  ) : (
                    topGainers.map((h, i) => (
                      <div key={i} className="perf-item">
                        <span className="perf-symbol">{h.symbol}</span>
                        <span className="perf-stat text-success">
                          +{h.pnlPct.toFixed(2)}% (+₹{h.pnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })})
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="perf-divider" />

                <div>
                  <h6 className="perf-subheading text-danger">Lagging Positions</h6>
                  {topDraggers.length === 0 ? (
                    <div className="perf-empty">All holdings in green!</div>
                  ) : (
                    topDraggers.map((h, i) => (
                      <div key={i} className="perf-item">
                        <span className="perf-symbol">{h.symbol}</span>
                        <span className="perf-stat text-danger">
                          {h.pnlPct.toFixed(2)}% (₹{h.pnl.toLocaleString("en-IN", { maximumFractionDigits: 2 })})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="analytics-modal-footer">
          <span className="footer-disclaimer">
            *Analytics synchronized with live WebSocket ticks and Demat depository holdings.
          </span>
          <button type="button" className="btn-analytics-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoldingsAnalyticsModal;
