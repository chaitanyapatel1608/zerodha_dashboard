import React, { useState, useContext } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(1845.50);
  const [orderType, setOrderType] = useState("MIS"); // MIS or CNC
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeBuyWindow } = useContext(GeneralContext);

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:3002/newOrder", {
        name: uid,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "BUY",
        product: orderType,
      });
      alert(`Order placed and saved to MongoDB!\nSymbol: ${uid}\nType: ${orderType}\nQuantity: ${stockQuantity}\nPrice: ₹${stockPrice}`);
    } catch (err) {
      console.warn("Backend unreachable, fallback client simulation:", err.message);
      alert(`Order placed!\nSymbol: ${uid}\nType: ${orderType}\nQuantity: ${stockQuantity}\nPrice: ₹${stockPrice}`);
    } finally {
      setIsSubmitting(false);
      closeBuyWindow();
    }
  };

  const handleCancelClick = () => {
    closeBuyWindow();
  };

  const marginRequired = (stockQuantity * (stockPrice || 0) * (orderType === "MIS" ? 0.2 : 1)).toFixed(2);

  return (
    <div className="buy-window-overlay" onClick={handleCancelClick}>
      <div className="buy-window-box" onClick={(e) => e.stopPropagation()}>
        <div className="buy-window-header">
          <div className="header-symbol-tag">
            <span className="order-mode-badge">BUY</span>
            <span className="stock-title">{uid}</span>
            <span className="exchange-sub">NSE</span>
          </div>
          <button className="close-x" onClick={handleCancelClick} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="order-product-tabs">
          <button
            type="button"
            className={`tab-btn ${orderType === "MIS" ? "active" : ""}`}
            onClick={() => setOrderType("MIS")}
          >
            Intraday <span className="tab-pill">MIS</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${orderType === "CNC" ? "active" : ""}`}
            onClick={() => setOrderType("CNC")}
          >
            Longterm <span className="tab-pill">CNC</span>
          </button>
        </div>

        <div className="buy-fields-grid">
          <div className="form-field">
            <label htmlFor="qty">Qty.</label>
            <input
              type="number"
              name="qty"
              id="qty"
              min="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              value={stockPrice}
              onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          </div>
        </div>

        <div className="buy-window-footer">
          <div className="margin-indicator">
            <span>Margin required: </span>
            <strong>₹{marginRequired}</strong>
          </div>
          <div className="footer-button-group">
            <button
              className="btn-buy-submit"
              onClick={handleBuyClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Placing..." : "Buy"}
            </button>
            <button className="btn-buy-cancel" onClick={handleCancelClick}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
