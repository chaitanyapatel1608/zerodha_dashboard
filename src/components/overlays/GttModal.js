import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import "./GttModal.css";

const API_BASE = "http://localhost:3002";

const GttModal = ({ isOpen, onClose, initialSymbol = "INFY", initialPrice = null }) => {
  const { showToast, refreshPortfolio, currentUser } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();

  const [symbol, setSymbol] = useState(initialSymbol);
  const [type, setType] = useState("SINGLE"); // "SINGLE" | "OCO"
  const [transactionType, setTransactionType] = useState("BUY"); // "BUY" | "SELL"
  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live price
  const livePrice = quotes[symbol]?.price || initialPrice || 1845.50;

  // Single trigger states
  const [triggerPrice, setTriggerPrice] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  // OCO states
  const [stoplossTrigger, setStoplossTrigger] = useState("");
  const [stoplossPrice, setStoplossPrice] = useState("");
  const [targetTrigger, setTargetTrigger] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
    if (livePrice) {
      // Default suggested triggers
      setTriggerPrice((livePrice * 0.98).toFixed(2));
      setOrderPrice((livePrice * 0.985).toFixed(2));
      setStoplossTrigger((livePrice * 0.95).toFixed(2));
      setStoplossPrice((livePrice * 0.945).toFixed(2));
      setTargetTrigger((livePrice * 1.05).toFixed(2));
      setTargetPrice((livePrice * 1.055).toFixed(2));
    }
  }, [initialSymbol, livePrice]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getPercentDiff = (val) => {
    if (!val || isNaN(val) || !livePrice) return "";
    const diff = ((Number(val) - livePrice) / livePrice) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}% of LTP`;
  };

  const handlePlaceGtt = async (e) => {
    e.preventDefault();

    if (!symbol || !qty || Number(qty) <= 0) {
      showToast("Invalid Input", "Please enter valid symbol and quantity.", "error");
      return;
    }

    const payload = {
      userId: currentUser?.userId,
      symbol: symbol.toUpperCase(),
      exchange: "NSE",
      type,
      transactionType,
      product: "CNC",
      qty: Number(qty),
    };

    if (type === "SINGLE") {
      if (!triggerPrice || !orderPrice) {
        showToast("Missing Prices", "Please enter Trigger Price and Order Price.", "error");
        return;
      }
      payload.triggerPrice = Number(triggerPrice);
      payload.orderPrice = Number(orderPrice);
    } else {
      if (!stoplossTrigger || !stoplossPrice || !targetTrigger || !targetPrice) {
        showToast("Missing Prices", "Please enter Stop-Loss and Target values.", "error");
        return;
      }
      payload.stoplossTrigger = Number(stoplossTrigger);
      payload.stoplossPrice = Number(stoplossPrice);
      payload.targetTrigger = Number(targetTrigger);
      payload.targetPrice = Number(targetPrice);
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/newGtt`, payload);
      if (res.data?.success) {
        showToast(
          "GTT Created Successfully",
          `${type} GTT trigger created for ${symbol} (${qty} shares). Active until triggered.`,
          "success"
        );
        refreshPortfolio();
        onClose();
      }
    } catch (err) {
      showToast(
        "GTT Creation Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gtt-modal-overlay" onClick={onClose}>
      <div className="gtt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gtt-modal-header">
          <div className="gtt-header-title">
            <h4>Create GTT &bull; {symbol}</h4>
            <span className="gtt-ltp-badge">
              LTP: <strong>₹{Number(livePrice).toFixed(2)}</strong>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handlePlaceGtt}>
          <div className="gtt-modal-body">
            {/* Type selector */}
            <div className="gtt-type-selector">
              <label className="gtt-radio-label">
                <input
                  type="radio"
                  name="gttType"
                  value="SINGLE"
                  checked={type === "SINGLE"}
                  onChange={() => setType("SINGLE")}
                />
                Single Trigger
              </label>
              <label className="gtt-radio-label">
                <input
                  type="radio"
                  name="gttType"
                  value="OCO"
                  checked={type === "OCO"}
                  onChange={() => setType("OCO")}
                />
                OCO (Stop-loss &amp; Target)
              </label>

              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={`btn btn-sm ${transactionType === "BUY" ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ fontSize: "11px", padding: "2px 10px" }}
                  onClick={() => setTransactionType("BUY")}
                >
                  BUY
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${transactionType === "SELL" ? "btn-danger" : "btn-outline-secondary"}`}
                  style={{ fontSize: "11px", padding: "2px 10px" }}
                  onClick={() => setTransactionType("SELL")}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Instrument & Qty */}
            <div className="row g-2 mb-3">
              <div className="col-8">
                <label className="gtt-field-label">Symbol</label>
                <div className="gtt-input-group">
                  <input
                    type="text"
                    className="gtt-input text-uppercase"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>
              <div className="col-4">
                <label className="gtt-field-label">Quantity</label>
                <div className="gtt-input-group">
                  <input
                    type="number"
                    min="1"
                    className="gtt-input"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SINGLE TRIGGER SECTION */}
            {type === "SINGLE" && (
              <div className="gtt-section-card">
                <div className="gtt-section-title">
                  <span>Trigger Condition</span>
                  <span style={{ fontSize: "11px", color: "#666" }}>Trigger order when price reaches</span>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="gtt-field-label">Trigger Price</label>
                    <div className="gtt-input-group">
                      <span className="gtt-input-prefix">₹</span>
                      <input
                        type="number"
                        step="0.05"
                        className="gtt-input"
                        value={triggerPrice}
                        onChange={(e) => setTriggerPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="gtt-pct-diff">{getPercentDiff(triggerPrice)}</div>
                  </div>
                  <div className="col-6">
                    <label className="gtt-field-label">Order Price (Limit)</label>
                    <div className="gtt-input-group">
                      <span className="gtt-input-prefix">₹</span>
                      <input
                        type="number"
                        step="0.05"
                        className="gtt-input"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="gtt-pct-diff">Limit price sent to exchange</div>
                  </div>
                </div>
              </div>
            )}

            {/* OCO TRIGGER SECTION */}
            {type === "OCO" && (
              <>
                {/* Stop Loss Card */}
                <div className="gtt-section-card" style={{ borderColor: "#fed7d7", backgroundColor: "#fff5f5" }}>
                  <div className="gtt-section-title" style={{ color: "#c53030" }}>
                    <span>Stop-Loss Leg</span>
                    <span style={{ fontSize: "11px" }}>Triggers on downside protect</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="gtt-field-label">Stop-Loss Trigger</label>
                      <div className="gtt-input-group">
                        <span className="gtt-input-prefix">₹</span>
                        <input
                          type="number"
                          step="0.05"
                          className="gtt-input"
                          value={stoplossTrigger}
                          onChange={(e) => setStoplossTrigger(e.target.value)}
                          required
                        />
                      </div>
                      <div className="gtt-pct-diff">{getPercentDiff(stoplossTrigger)}</div>
                    </div>
                    <div className="col-6">
                      <label className="gtt-field-label">Limit Price</label>
                      <div className="gtt-input-group">
                        <span className="gtt-input-prefix">₹</span>
                        <input
                          type="number"
                          step="0.05"
                          className="gtt-input"
                          value={stoplossPrice}
                          onChange={(e) => setStoplossPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Card */}
                <div className="gtt-section-card" style={{ borderColor: "#c6f6d5", backgroundColor: "#f0fff4" }}>
                  <div className="gtt-section-title" style={{ color: "#22543d" }}>
                    <span>Target Leg</span>
                    <span style={{ fontSize: "11px" }}>Triggers on upside profit taking</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="gtt-field-label">Target Trigger</label>
                      <div className="gtt-input-group">
                        <span className="gtt-input-prefix">₹</span>
                        <input
                          type="number"
                          step="0.05"
                          className="gtt-input"
                          value={targetTrigger}
                          onChange={(e) => setTargetTrigger(e.target.value)}
                          required
                        />
                      </div>
                      <div className="gtt-pct-diff">{getPercentDiff(targetTrigger)}</div>
                    </div>
                    <div className="col-6">
                      <label className="gtt-field-label">Limit Price</label>
                      <div className="gtt-input-group">
                        <span className="gtt-input-prefix">₹</span>
                        <input
                          type="number"
                          step="0.05"
                          className="gtt-input"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="gtt-modal-footer">
            <span className="gtt-disclaimer">
              GTT orders are valid for 1 year or until triggered. Margin is deducted only upon trigger.
            </span>
            <div className="gtt-footer-btns">
              <button type="button" className="btn-gtt-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-gtt-place" disabled={isSubmitting}>
                {isSubmitting ? "Placing..." : "Place GTT"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GttModal;
