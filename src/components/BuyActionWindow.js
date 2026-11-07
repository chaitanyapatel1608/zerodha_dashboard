import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const API_BASE = "http://localhost:3002";

const BuyActionWindow = ({ uid, initialMode = "BUY", initialPrice = null }) => {
  const {
    closeBuyWindow,
    currentUser,
    showToast,
    refreshPortfolio,
    openDepthModal,
    userSegments = {},
    openSegmentModal,
  } = useContext(GeneralContext);
  const navigate = useNavigate();

  const [orderMode, setOrderMode] = useState(initialMode || "BUY"); // "BUY" or "SELL"
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(
    initialPrice !== null && !isNaN(initialPrice) ? Number(initialPrice) : 1845.5
  );
  const [orderType, setOrderType] = useState("CNC"); // "CNC" (Longterm) or "MIS" (Intraday)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMargin, setAvailableMargin] = useState(null);

  // Segment Risk Evaluation
  const getRequiredSegment = (symbol) => {
    const upper = (symbol || "").toUpperCase();
    if (
      upper.includes(" FUT") ||
      upper.includes(" CE") ||
      upper.includes(" PE") ||
      (upper.includes("NIFTY") && (upper.includes("OPT") || upper.includes("FUT")))
    ) {
      return "futuresAndOptions";
    }
    if (
      upper.includes("CRUDEOIL") ||
      upper.includes("GOLD") ||
      upper.includes("SILVER") ||
      upper.includes("NATURALGAS") ||
      upper.includes("MCX")
    ) {
      return "commodity";
    }
    if (
      upper.includes("USDINR") ||
      upper.includes("EURINR") ||
      upper.includes("GBPINR") ||
      upper.includes("JPYINR")
    ) {
      return "currency";
    }
    return "equity";
  };

  const targetSegmentKey = getRequiredSegment(uid);
  const targetSegmentConfig = userSegments?.[targetSegmentKey];
  const isSegmentDisabled = targetSegmentConfig && targetSegmentConfig.active === false;

  // Fetch live available margin for user
  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const res = await axios.get(`${API_BASE}/userFunds`, {
          params: { userId: currentUser?.userId },
        });
        if (res.data && res.data.equity) {
          setAvailableMargin(res.data.equity.availableMargin);
        }
      } catch (err) {
        console.warn("Could not load user funds:", err.message);
      }
    };
    fetchFunds();
  }, [currentUser]);

  const handleOrderSubmit = async () => {
    if (!uid) return;

    if (isSegmentDisabled) {
      showToast(
        "Segment Deactivated",
        `Order rejected! Trading in "${targetSegmentConfig?.name || targetSegmentKey}" is disabled under your Risk Settings / Kill Switch.`,
        "error"
      );
      return;
    }

    const numQty = Number(stockQuantity);
    const numPrice = Number(stockPrice);

    if (isNaN(numQty) || numQty <= 0) {
      showToast("Invalid Quantity", "Quantity must be at least 1 share.", "error");
      return;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      showToast("Invalid Price", "Price must be greater than 0.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/newOrder`, {
        name: uid,
        qty: numQty,
        price: numPrice,
        mode: orderMode,
        product: orderType,
        userId: currentUser?.userId,
      });

      if (res.data && res.data.success) {
        showToast(
          "Order Executed",
          res.data.message || `${orderMode} ${numQty} ${uid} executed successfully!`,
          "success"
        );
        // Refresh all portfolio views (Holdings, Orders, Positions, Funds)
        refreshPortfolio();
        closeBuyWindow();
      } else {
        showToast("Order Failed", res.data?.message || "Failed to execute order.", "error");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to execute order on server.";
      showToast("Order Rejected", errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    closeBuyWindow();
  };

  // Margin calculation: MIS is 20% (5x leverage), CNC is 100%
  const numQty = Number(stockQuantity) || 0;
  const numPrice = Number(stockPrice) || 0;
  const orderCost = numQty * numPrice;
  const marginRequired = (orderType === "MIS" ? orderCost * 0.2 : orderCost).toFixed(2);

  const isSellMode = orderMode === "SELL";

  return (
    <div className="buy-window-overlay" onClick={handleCancelClick}>
      <div
        className={`buy-window-box ${isSellMode ? "mode-sell-box" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`buy-window-header ${isSellMode ? "header-sell" : ""}`}>
          <div className="header-symbol-tag">
            {/* Mode Toggle Button */}
            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${orderMode === "BUY" ? "active-buy" : ""}`}
                onClick={() => setOrderMode("BUY")}
              >
                BUY
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${orderMode === "SELL" ? "active-sell" : ""}`}
                onClick={() => setOrderMode("SELL")}
              >
                SELL
              </button>
            </div>

            <span className="stock-title">{uid}</span>
            <span className="exchange-sub">NSE</span>

            <div style={{ marginLeft: "auto", marginRight: "12px", display: "flex", gap: "6px" }}>
              <button
                type="button"
                style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1px solid rgba(255, 255, 255, 0.45)",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {
                  closeBuyWindow();
                  navigate(`/chart?symbol=${uid}`);
                }}
                title="View full-screen chart"
              >
                Chart
              </button>
              <button
                type="button"
                style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1px solid rgba(255, 255, 255, 0.45)",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {
                  closeBuyWindow();
                  openDepthModal(uid);
                }}
                title="View Level-2 market depth"
              >
                Depth
              </button>
            </div>
          </div>

          <button className="close-x" onClick={handleCancelClick} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Product Selection Tabs */}
        <div className="order-product-tabs">
          <button
            type="button"
            className={`tab-btn ${orderType === "MIS" ? "active" : ""}`}
            onClick={() => setOrderType("MIS")}
          >
            Intraday <span className="tab-pill">MIS 5x</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${orderType === "CNC" ? "active" : ""}`}
            onClick={() => setOrderType("CNC")}
          >
            Longterm <span className="tab-pill">CNC</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${orderType === "NRML" ? "active" : ""}`}
            onClick={() => setOrderType("NRML")}
          >
            Overnight <span className="tab-pill">NRML</span>
          </button>
        </div>

        {/* Quantity and Price Fields */}
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
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="price">Price (₹)</label>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              min="0.05"
              value={stockPrice}
              onChange={(e) => setStockPrice(parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          </div>
        </div>

        {/* Segment Disabled Alert */}
        {isSegmentDisabled && (
          <div className="buy-window-segment-alert">
            <span className="alert-shield">🛑</span>
            <div className="alert-text">
              <strong>Segment Deactivated ({targetSegmentConfig?.name || targetSegmentKey})</strong>
              <p>Trading in this segment is disabled under your Kill Switch risk settings.</p>
            </div>
            <button
              type="button"
              className="btn-manage-seg"
              onClick={() => {
                closeBuyWindow();
                openSegmentModal();
              }}
            >
              Settings
            </button>
          </div>
        )}

        {/* Footer with Margin & Action Buttons */}
        <div className="buy-window-footer">
          <div className="margin-indicator">
            <div>
              <span>Margin required: </span>
              <strong>₹{Number(marginRequired).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
            {availableMargin && (
              <div className="available-margin-hint">
                Available: ₹{availableMargin}
              </div>
            )}
          </div>

          <div className="footer-button-group">
            <button
              className={`btn-order-submit ${isSellMode ? "btn-sell" : "btn-buy"}`}
              onClick={handleOrderSubmit}
              disabled={isSubmitting || isSegmentDisabled}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  <span>Executing...</span>
                </>
              ) : isSellMode ? (
                "Sell"
              ) : (
                "Buy"
              )}
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
