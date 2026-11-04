import React, { useState, useEffect, useMemo, useContext } from "react";
import GeneralContext from "./GeneralContext";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import { holdingsData } from "../data/mockData";
import { useMarketFeed } from "../context/MarketFeedContext";


const Holdings = () => {
  const { portfolioTrigger } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3002/allHoldings")
      .then((res) => {
        setHoldings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable, using fallback mockData:", err.message);
        setHoldings(holdingsData);
        setLoading(false);
      });
  }, [portfolioTrigger]);

  const filteredHoldings = useMemo(() => {
    return holdings.filter((stock) => {
      const sym = stock.instrument || stock.name || "";
      return sym.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [holdings, searchTerm]);

  const totalInvestment = filteredHoldings.reduce(
    (acc, stock) => acc + (stock.avgCost || stock.avg || 0) * (stock.qty || 0),
    0
  );
  const totalCurrentVal = filteredHoldings.reduce((acc, stock) => {
    const sym = stock.instrument || stock.name || "";
    const live = quotes[sym];
    const livePrice = live ? live.price : (stock.ltp || stock.price || stock.avgCost || 0);
    return acc + livePrice * (stock.qty || 0);
  }, 0);
  const totalPnl = totalCurrentVal - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100).toFixed(2) : "0.00";
  const isOverallProfit = totalPnl >= 0;

  return (
    <div className="holdings-page-container">
      <AccountStatusBanner
        message="Account status: Holdings statement synced with CDSL Demat depository as of market close."
        linkText="View CDSL e-Voting"
      />

      {/* Header and Subtabs */}
      <div className="holdings-top-bar">
        <div className="page-subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`subtab-btn ${activeTab === "equity" ? "active" : ""}`}
            onClick={() => setActiveTab("equity")}
          >
            Equity ({filteredHoldings.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "mf" ? "active" : ""}`}
            onClick={() => setActiveTab("mf")}
          >
            Mutual funds (0)
          </button>
        </div>

        <div className="holdings-actions-right">
          <input
            type="text"
            placeholder="Search holdings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="holdings-search-input"
          />
          <a
            href="#analytics"
            className="subtle-link"
            onClick={(e) => {
              e.preventDefault();
              alert("Holdings portfolio analytics & sector allocation");
            }}
          >
            Analytics &rsaquo;
          </a>
          <a
            href="#download"
            className="subtle-link"
            onClick={(e) => {
              e.preventDefault();
              alert("Exporting holdings CSV...");
            }}
          >
            Download CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center text-muted">
          Loading holdings from database...
        </div>
      ) : activeTab === "mf" ? (
        <div className="empty-state-view">
          <div className="empty-state-illustration">
            <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h4 className="empty-state-title">No Direct Mutual Funds in Demat</h4>
          <p className="empty-state-subtitle">
            Invest in commission-free direct mutual funds via Zerodha Coin.
          </p>
          <button
            className="btn-kite-primary"
            onClick={() => alert("Exploring Zerodha Coin Mutual Funds")}
          >
            Explore Coin
          </button>
        </div>
      ) : (
        <>
          <div className="kite-table-container">
            <table className="kite-data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Qty.</th>
                  <th>Avg. cost</th>
                  <th>LTP</th>
                  <th>Cur. val</th>
                  <th>P&L</th>
                  <th>Net chg.</th>
                  <th>Day chg.</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((stock, idx) => {
                  const symbol = stock.instrument || stock.name;
                  const avgCost = stock.avgCost || stock.avg || 0;
                  const live = quotes[symbol];
                  const ltp = live ? live.price : (stock.ltp || stock.price || avgCost);
                  const curVal = ltp * (stock.qty || 0);
                  const pnl = curVal - avgCost * (stock.qty || 0);
                  const isProfit = pnl >= 0;
                  const netChg =
                    avgCost > 0
                      ? (pnl >= 0 ? "+" : "") + (((ltp - avgCost) / avgCost) * 100).toFixed(2) + "%"
                      : stock.netChg || "0.00%";
                  const dayChg = live ? live.percent : (stock.dayChg || "0.00%");
                  const isDayProfit = !dayChg.startsWith("-");

                  let flashClass = "";
                  if (live?.tickDirection === "up") flashClass = "tick-flash-up";
                  else if (live?.tickDirection === "down") flashClass = "tick-flash-down";

                  return (
                    <tr key={stock._id || symbol || idx}>
                      <td className="symbol-cell">{symbol}</td>
                      <td>{stock.qty}</td>
                      <td>{avgCost.toFixed(2)}</td>
                      <td className={flashClass}>{ltp.toFixed(2)}</td>
                      <td>
                        {curVal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {isProfit ? "+" : ""}
                        {pnl.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {netChg}
                      </td>
                      <td className={isDayProfit ? "text-up" : "text-down"}>
                        {dayChg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Holdings Summary Row */}
          <div className="holdings-summary-footer">
            <div className="summary-col">
              <span className="summary-val">
                ₹{totalInvestment.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="summary-label">Total investment</span>
            </div>
            <div className="summary-col">
              <span className="summary-val">
                ₹{totalCurrentVal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="summary-label">Current value</span>
            </div>
            <div className="summary-col">
              <span
                className={`summary-val ${isOverallProfit ? "text-up" : "text-down"}`}
              >
                {isOverallProfit ? "+" : ""}₹
                {totalPnl.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ({isOverallProfit ? "+" : ""}
                {totalPnlPercent}%)
              </span>
              <span className="summary-label">Total P&L</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Holdings;
