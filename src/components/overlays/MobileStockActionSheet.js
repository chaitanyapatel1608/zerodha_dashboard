import React, { useEffect } from "react";
import "./MobileStockActionSheet.css";

const MobileStockActionSheet = ({
  stock,
  isOpen,
  onClose,
  onBuy,
  onSell,
  onChart,
  onDepth,
  onRemove,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !stock) return null;

  const isUp = !stock.isDown;
  const priceNum = Number(stock.price || 0).toFixed(2);

  return (
    <div className="mobile-stock-sheet-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="mobile-stock-sheet-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sheet-drag-handle-wrapper">
          <div className="sheet-drag-handle"></div>
        </div>

        {/* Header: Symbol & Live Price */}
        <div className="sheet-header-row">
          <div className="sheet-title-left">
            <div className="sheet-symbol">
              <span>{stock.symbol}</span>
              <span className="sheet-exchange-badge">{stock.exchange || "NSE"}</span>
            </div>
            <span className="sheet-company-name">{stock.name || stock.symbol}</span>
          </div>

          <div className="sheet-price-right">
            <span className="sheet-ltp">₹{priceNum}</span>
            <span className={`sheet-change-badge ${isUp ? "up" : "down"}`}>
              {stock.percent || (isUp ? "+0.00%" : "-0.00%")} {isUp ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons: BUY (Blue) & SELL (Orange) */}
        <div className="sheet-primary-buttons-grid">
          <button
            type="button"
            className="sheet-btn-buy"
            onClick={() => {
              onClose();
              onBuy();
            }}
          >
            <span>BUY</span>
          </button>

          <button
            type="button"
            className="sheet-btn-sell"
            onClick={() => {
              onClose();
              onSell();
            }}
          >
            <span>SELL</span>
          </button>
        </div>

        {/* Secondary Tools: Chart, Depth, Delete */}
        <div className="sheet-secondary-actions-bar">
          <button
            type="button"
            className="sheet-action-icon-btn"
            onClick={() => {
              onClose();
              onChart();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>View Chart</span>
          </button>

          <button
            type="button"
            className="sheet-action-icon-btn"
            onClick={() => {
              onClose();
              onDepth();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
            <span>Market Depth</span>
          </button>

          <button
            type="button"
            className="sheet-action-icon-btn danger"
            onClick={() => {
              onClose();
              onRemove();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileStockActionSheet;
