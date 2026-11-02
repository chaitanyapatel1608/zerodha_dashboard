import React, { useState, useEffect } from "react";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import { accountBalances as fallbackBalances } from "../data/mockData";

const Funds = () => {
  const [funds, setFunds] = useState(fallbackBalances);

  useEffect(() => {
    axios
      .get("http://localhost:3002/userFunds")
      .then((res) => {
        if (res.data && res.data.equity) {
          setFunds(res.data);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for funds, using fallback:", err.message);
      });
  }, []);

  const equity = funds.equity || fallbackBalances.equity;

  return (
    <div className="funds-page-container">
      <AccountStatusBanner
        message="Account status: Funds added after 15:30 will be updated for trading on the next business day."
        linkText="View fund policies"
      />

      {/* Top Action Bar */}
      <div className="funds-action-bar">
        <span className="funds-subtext">
          Instant, zero-cost fund transfers with UPI or Netbanking
        </span>
        <div className="funds-buttons-group">
          <button
            className="btn-kite-green"
            onClick={() => alert("Add funds modal with UPI / Netbanking")}
          >
            Add funds
          </button>
          <button
            className="btn-kite-blue"
            onClick={() => alert("Withdraw funds request window")}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Two Columns Grid */}
      <div className="funds-grid">
        {/* Equity Column */}
        <div className="funds-column">
          <div className="funds-column-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v12M16 10H8"></path>
            </svg>
            <h3 className="column-title">Equity</h3>
          </div>

          <div className="funds-data-card">
            <div className="margin-row prominent">
              <span className="row-label">Available margin</span>
              <span className="row-val text-brand-blue">₹{equity.availableMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Used margin</span>
              <span className="row-val font-medium">₹{equity.usedMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Available cash</span>
              <span className="row-val font-medium">₹{equity.availableCash}</span>
            </div>

            <hr className="funds-divider" />

            <div className="margin-row">
              <span className="row-label">Opening balance</span>
              <span className="row-val">₹{equity.openingBalance}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Payin</span>
              <span className="row-val">₹{equity.payin || "0.00"}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Payout</span>
              <span className="row-val">₹{equity.payout || "0.00"}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">SPAN</span>
              <span className="row-val">₹{equity.span}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Delivery margin</span>
              <span className="row-val">₹{equity.deliveryMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Exposure</span>
              <span className="row-val">₹{equity.exposure}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Options premium</span>
              <span className="row-val">₹{equity.optionsPremium}</span>
            </div>

            <hr className="funds-divider" />

            <div className="margin-row">
              <span className="row-label">Collateral (Liquid funds)</span>
              <span className="row-val">₹{equity.collateralLiquid}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Collateral (Equity)</span>
              <span className="row-val">₹{equity.collateralEquity}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Total collateral</span>
              <span className="row-val font-medium">₹{equity.totalCollateral}</span>
            </div>
          </div>
        </div>

        {/* Commodity Column */}
        <div className="funds-column">
          <div className="funds-column-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            <h3 className="column-title">Commodity</h3>
          </div>

          <div className="funds-commodity-empty-card">
            <div className="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h4>You don't have a commodity account</h4>
            <p>
              Trade MCX Crude Oil, Gold, Silver, Natural Gas, and other commodities by activating your commodity segment.
            </p>
            <button
              className="btn-kite-blue"
              onClick={() => alert("Open commodity account in Zerodha Console")}
            >
              Open Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Funds;
