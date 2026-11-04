import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import AccountStatusBanner from "./common/AccountStatusBanner";
import MarketOverviewChart from "./dashboard/MarketOverviewChart";
import GainersLosersPanel from "./dashboard/GainersLosersPanel";
import IpoCalendarPanel from "./dashboard/IpoCalendarPanel";
import { accountBalances as fallbackBalances, holdingsData as fallbackHoldings } from "../data/mockData";
import { useMarketFeed } from "../context/MarketFeedContext";


const Summary = () => {
  const { currentUser, portfolioTrigger } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();
  const [holdings, setHoldings] = useState([]);
  const [funds, setFunds] = useState(fallbackBalances);

  useEffect(() => {
    // 1. Fetch live holdings from MongoDB
    axios
      .get("http://localhost:3002/allHoldings")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setHoldings(res.data);
        } else {
          setHoldings(fallbackHoldings);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for summary holdings, using fallback:", err.message);
        setHoldings(fallbackHoldings);
      });

    // 2. Fetch live funds from MongoDB
    axios
      .get("http://localhost:3002/userFunds")
      .then((res) => {
        if (res.data && res.data.equity) {
          setFunds(res.data);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for summary funds, using fallback:", err.message);
      });
  }, [portfolioTrigger, currentUser]);

  const totalInvestment = holdings.reduce(
    (acc, h) => acc + (h.avgCost || h.avg || 0) * (h.qty || 0),
    0
  );
  const currentVal = holdings.reduce((acc, h) => {
    const sym = h.instrument || h.name || "";
    const live = quotes[sym];
    const livePrice = live ? live.price : (h.curVal ? h.curVal / (h.qty || 1) : (h.price || h.ltp || h.avgCost || 0));
    return acc + livePrice * (h.qty || 0);
  }, 0);
  const totalPnl = currentVal - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100).toFixed(2) : "0.00";
  const isPnlPositive = totalPnl >= 0;

  const equityFunds = funds.equity || fallbackBalances.equity;

  return (
    <div className="dashboard-main-view">
      {/* Account Status Banner */}
      <AccountStatusBanner
        message="Account status: Your equity and derivatives account is active. Nominee addition pending."
        linkText="Add nominee"
      />

      {/* Greeting Section */}
      <div className="greeting-section">
        <h1 className="greeting-text">Hi, {currentUser.name}</h1>
        <hr className="subtle-divider" />
      </div>

      {/* Account Balances Grid (Wide Equity Block) */}
      <div className="balances-grid">
        {/* Equity Balance */}
        <div className="balance-card equity-full-width">
          <div className="card-header-row">
            <div className="title-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v12M16 10H8"></path>
              </svg>
              <span className="card-title">Equity</span>
            </div>
            <div className="equity-card-header-links">
              <Link to="/funds" className="card-link">
                View statement &rsaquo;
              </Link>
            </div>
          </div>

          <div className="balance-content equity-wide-content">
            <div className="balance-primary">
              <span className="balance-number">
                {currentUser.isPrivacyMode ? "••••••" : `₹${equityFunds.availableMargin}`}
              </span>
              <span className="balance-label">Margin available</span>
            </div>
            <div className="balance-secondary equity-wide-metrics">
              <div className="secondary-item">
                <span className="item-label">Margins used</span>
                <span className="item-val">
                  {currentUser.isPrivacyMode ? "••••" : `₹${equityFunds.usedMargin}`}
                </span>
              </div>
              <div className="secondary-item">
                <span className="item-label">Opening balance</span>
                <span className="item-val">
                  {currentUser.isPrivacyMode ? "••••" : `₹${equityFunds.openingBalance}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Overview Summary */}
      <div className="holdings-snapshot-section">
        <div className="card-header-row">
          <div className="title-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="card-title">Holdings ({holdings.length})</span>
          </div>
          <Link to="/holdings" className="card-link">
            View holdings &rsaquo;
          </Link>
        </div>

        <div className="holdings-snapshot-grid">
          <div className="snapshot-stat">
            <span className="stat-label">Total investment</span>
            <span className="stat-val">
              {currentUser.isPrivacyMode
                ? "••••••"
                : `₹${totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="snapshot-stat">
            <span className="stat-label">Current value</span>
            <span className="stat-val">
              {currentUser.isPrivacyMode
                ? "••••••"
                : `₹${currentVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="snapshot-stat">
            <span className="stat-label">Total P&L</span>
            <span className={`stat-val ${isPnlPositive ? "text-up" : "text-down"}`}>
              {currentUser.isPrivacyMode
                ? "••••••"
                : `${isPnlPositive ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isPnlPositive ? "+" : ""}${pnlPercent}%)`}
            </span>
          </div>
        </div>
        <hr className="subtle-divider" />
      </div>

      {/* Market Overview Chart */}
      <MarketOverviewChart />

      {/* Top Gainers & Top Losers */}
      <GainersLosersPanel />

      {/* IPO and Market Information Panel */}
      <IpoCalendarPanel />
    </div>
  );
};

export default Summary;
