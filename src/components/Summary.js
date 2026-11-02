import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import AccountStatusBanner from "./common/AccountStatusBanner";
import MarketOverviewChart from "./dashboard/MarketOverviewChart";
import GainersLosersPanel from "./dashboard/GainersLosersPanel";
import IpoCalendarPanel from "./dashboard/IpoCalendarPanel";
import { accountBalances as fallbackBalances, holdingsData as fallbackHoldings } from "../data/mockData";

const Summary = () => {
  const { currentUser } = useContext(GeneralContext);
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
  }, []);

  const totalInvestment = holdings.reduce(
    (acc, h) => acc + (h.avgCost || h.avg || 0) * (h.qty || 0),
    0
  );
  const currentVal = holdings.reduce(
    (acc, h) => acc + (h.curVal || (h.price || h.ltp || 0) * (h.qty || 0)),
    0
  );
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

      {/* Account Balances Grid */}
      <div className="balances-grid">
        {/* Equity Balance */}
        <div className="balance-card">
          <div className="card-header-row">
            <div className="title-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v12M16 10H8"></path>
              </svg>
              <span className="card-title">Equity</span>
            </div>
            <Link to="/funds" className="card-link">
              View statement &rsaquo;
            </Link>
          </div>

          <div className="balance-content">
            <div className="balance-primary">
              <span className="balance-number">
                {currentUser.isPrivacyMode ? "••••••" : `₹${equityFunds.availableMargin}`}
              </span>
              <span className="balance-label">Margin available</span>
            </div>
            <div className="balance-secondary">
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

        {/* Commodity Balance */}
        <div className="balance-card">
          <div className="card-header-row">
            <div className="title-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <span className="card-title">Commodity</span>
            </div>
          </div>

          <div className="commodity-inactive-box">
            <p>You don't have a commodity trading account yet.</p>
            <button
              className="btn-link-action"
              onClick={() => alert("Redirecting to Zerodha Console commodity activation...")}
            >
              Activate MCX now &rsaquo;
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Overview Summary */}
      <div className="holdings-snapshot-section">
        <div className="card-header-row">
          <div className="title-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
