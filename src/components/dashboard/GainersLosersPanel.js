import React from "react";
import { topGainers, topLosers } from "../../data/mockData";

const GainersLosersPanel = () => {
  return (
    <div className="gainers-losers-wrapper">
      {/* Top Gainers */}
      <div className="mover-card">
        <div className="mover-header">
          <div className="mover-title-group">
            <span className="card-title">Top gainers</span>
            <span className="category-tag">NIFTY 50</span>
          </div>
          <a href="#view-gainers" className="view-all-link" onClick={(e) => e.preventDefault()}>
            View all &rsaquo;
          </a>
        </div>
        <div className="mover-table">
          {topGainers.map((item) => (
            <div className="mover-row" key={item.symbol}>
              <div className="mover-symbol-info">
                <span className="symbol-name">{item.symbol}</span>
                <span className="exchange-label">{item.exchange}</span>
              </div>
              <div className="mover-price-info">
                <span className="price-val">₹{item.price.toFixed(2)}</span>
                <span className="percent-val text-up">{item.percent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Losers */}
      <div className="mover-card">
        <div className="mover-header">
          <div className="mover-title-group">
            <span className="card-title">Top losers</span>
            <span className="category-tag">NIFTY 50</span>
          </div>
          <a href="#view-losers" className="view-all-link" onClick={(e) => e.preventDefault()}>
            View all &rsaquo;
          </a>
        </div>
        <div className="mover-table">
          {topLosers.map((item) => (
            <div className="mover-row" key={item.symbol}>
              <div className="mover-symbol-info">
                <span className="symbol-name">{item.symbol}</span>
                <span className="exchange-label">{item.exchange}</span>
              </div>
              <div className="mover-price-info">
                <span className="price-val">₹{item.price.toFixed(2)}</span>
                <span className="percent-val text-down">{item.percent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GainersLosersPanel;
