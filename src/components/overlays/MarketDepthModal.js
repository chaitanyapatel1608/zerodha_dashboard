import React, { useMemo, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import "./MarketDepthModal.css";

const MarketDepthModal = ({ isOpen, onClose, symbol = "INFY" }) => {
  const { quotes } = useMarketFeed();
  const { openBuyWindow } = useContext(GeneralContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const stock = quotes[symbol] || {
    price: 1845.50,
    change: 12.50,
    percent: "+0.68%",
    isDown: false,
  };
  const ltp = Number(stock.price || 1800);

  // Derive realistic Level-2 Bid/Ask Order Book based on LTP
  const { bids, offers, totalBidQty, totalOfferQty, stats } = useMemo(() => {
    const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bidRows = [];
    const offerRows = [];
    let bSum = 0;
    let oSum = 0;

    for (let i = 1; i <= 5; i++) {
      const bPrice = +(ltp - i * 0.15).toFixed(2);
      const bQty = Math.floor(120 + ((seed * i * 37) % 1800));
      const bOrders = Math.floor(1 + ((seed + i) % 8));
      bSum += bQty;
      bidRows.push({ price: bPrice, qty: bQty, orders: bOrders });

      const oPrice = +(ltp + i * 0.15).toFixed(2);
      const oQty = Math.floor(150 + ((seed * i * 43) % 2100));
      const oOrders = Math.floor(1 + ((seed * 2 + i) % 9));
      oSum += oQty;
      offerRows.push({ price: oPrice, qty: oQty, orders: oOrders });
    }

    const openPrice = +(ltp * 0.992).toFixed(2);
    const highPrice = +(ltp * 1.018).toFixed(2);
    const lowPrice = +(ltp * 0.985).toFixed(2);
    const prevClose = +(ltp - (stock.change || 0)).toFixed(2);
    const volume = (Math.floor(250000 + (seed * 850) % 3500000)).toLocaleString("en-IN");
    const lcl = +(ltp * 0.90).toFixed(2);
    const ucl = +(ltp * 1.10).toFixed(2);

    return {
      bids: bidRows,
      offers: offerRows,
      totalBidQty: bSum,
      totalOfferQty: oSum,
      stats: { openPrice, highPrice, lowPrice, prevClose, volume, lcl, ucl },
    };
  }, [symbol, ltp, stock.change]);

  if (!isOpen) return null;

  const bidRatio = Math.round((totalBidQty / (totalBidQty + totalOfferQty || 1)) * 100);

  const handleBuy = () => {
    onClose();
    openBuyWindow(symbol, "BUY", ltp);
  };

  const handleSell = () => {
    onClose();
    openBuyWindow(symbol, "SELL", ltp);
  };

  const handleOpenChart = () => {
    onClose();
    navigate(`/chart?symbol=${symbol}`);
  };

  return (
    <div className="market-depth-overlay" onClick={onClose}>
      <div className="market-depth-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="market-depth-header">
          <div className="depth-header-left">
            <span className="depth-symbol">{symbol}</span>
            <span className="depth-exchange-pill">NSE</span>
            <span className={`depth-ltp ${stock.isDown ? "text-down" : "text-up"}`}>
              ₹{ltp.toFixed(2)}{" "}
              <small>({stock.percent || "0.00%"})</small>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="depth-body">
          {/* Level 2 Order Book */}
          <div className="depth-tables-grid">
            {/* Left: Bids */}
            <div className="depth-table-col col-bids">
              <h5>Bid (Buyers)</h5>
              <table className="depth-l2-table">
                <thead>
                  <tr>
                    <th>ORDERS</th>
                    <th>QTY</th>
                    <th>PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, idx) => (
                    <tr key={idx}>
                      <td>{b.orders}</td>
                      <td>{b.qty.toLocaleString("en-IN")}</td>
                      <td>{b.price.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="depth-total-row">
                    <td>Total</td>
                    <td>{totalBidQty.toLocaleString("en-IN")}</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Offers */}
            <div className="depth-table-col col-offers">
              <h5>Offer (Sellers)</h5>
              <table className="depth-l2-table">
                <thead>
                  <tr>
                    <th>PRICE</th>
                    <th>QTY</th>
                    <th>ORDERS</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o, idx) => (
                    <tr key={idx}>
                      <td>{o.price.toFixed(2)}</td>
                      <td>{o.qty.toLocaleString("en-IN")}</td>
                      <td>{o.orders}</td>
                    </tr>
                  ))}
                  <tr className="depth-total-row">
                    <td>-</td>
                    <td>{totalOfferQty.toLocaleString("en-IN")}</td>
                    <td>Total</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="depth-ratio-wrapper">
            <div className="ratio-bar-labels">
              <span style={{ color: "#387ed1" }}>Total Buy Qty: {bidRatio}%</span>
              <span style={{ color: "#df514c" }}>Total Sell Qty: {100 - bidRatio}%</span>
            </div>
            <div className="ratio-bar-track">
              <div className="ratio-bar-fill-bid" style={{ width: `${bidRatio}%` }}></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="market-stats-grid">
            <div className="stat-item">
              <span className="stat-label">Open</span>
              <span className="stat-val">₹{stats.openPrice.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High</span>
              <span className="stat-val text-up">₹{stats.highPrice.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low</span>
              <span className="stat-val text-down">₹{stats.lowPrice.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Prev. Close</span>
              <span className="stat-val">₹{stats.prevClose.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Volume</span>
              <span className="stat-val">{stats.volume}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lower Circuit</span>
              <span className="stat-val text-down">₹{stats.lcl.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Upper Circuit</span>
              <span className="stat-val text-up">₹{stats.ucl.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg. Price</span>
              <span className="stat-val">₹{((stats.highPrice + stats.lowPrice) / 2).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="market-depth-footer">
          <button className="btn-depth-chart" onClick={handleOpenChart}>
            View Chart &rsaquo;
          </button>
          <div className="footer-action-btns">
            <button className="btn-depth-buy" onClick={handleBuy}>
              BUY
            </button>
            <button className="btn-depth-sell" onClick={handleSell}>
              SELL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDepthModal;
