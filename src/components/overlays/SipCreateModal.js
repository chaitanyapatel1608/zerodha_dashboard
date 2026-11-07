import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import "./SipCreateModal.css";

const API_BASE = "http://localhost:3002";

const TIME_PRESETS = [
  { value: "09:30", label: "09:30 AM (Market Open)" },
  { value: "11:00", label: "11:00 AM (Mid-Day)" },
  { value: "14:30", label: "02:30 PM (Pre-Market Close)" },
];

const WEEK_DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

const SipCreateModal = ({ onClose, onSipCreated, preselectedMarketCode = null, initialBasketId = null }) => {
  const { currentUser, showToast, funds } = useContext(GeneralContext);
  const activeUserId = currentUser?.userId;

  // Mode: "MARKET_SIP" (50 Real SIPs, no basket required) vs "CUSTOM_BASKET"
  const [creationMode, setCreationMode] = useState(
    initialBasketId ? "CUSTOM_BASKET" : "MARKET_SIP"
  );

  const [marketSips, setMarketSips] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedMarketCode, setSelectedMarketCode] = useState(
    preselectedMarketCode || "SIP_NIFTYBEES"
  );
  const [selectedBasketId, setSelectedBasketId] = useState(initialBasketId || "");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [scheduleDay, setScheduleDay] = useState(5);
  const [scheduleTime, setScheduleTime] = useState("09:30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch 50 Real Market SIPs + User Baskets ONCE on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      axios.get(`${API_BASE}/marketSipsCatalog`).catch(() => ({ data: [] })),
      axios.get(`${API_BASE}/allBaskets`, { params: { userId: activeUserId } }).catch(() => ({ data: [] })),
    ]).then(([marketRes, basketRes]) => {
      if (!isMounted) return;
      const marketList = Array.isArray(marketRes.data) ? marketRes.data : [];
      const basketList = Array.isArray(basketRes.data) ? basketRes.data : [];

      setMarketSips(marketList);
      setBaskets(basketList);

      const initialPlan = preselectedMarketCode
        ? marketList.find((m) => m.code === preselectedMarketCode) || marketList[0]
        : marketList[0];
      if (initialPlan) {
        setSelectedMarketCode(initialPlan.code);
      }

      const initialBasket = initialBasketId
        ? basketList.find((b) => b._id === initialBasketId) || basketList[0]
        : basketList[0];
      if (initialBasket) {
        setSelectedBasketId(initialBasket._id);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeUserId, preselectedMarketCode, initialBasketId]);

  // Selected item details
  const activeMarketPlan = useMemo(() => {
    return marketSips.find((m) => m.code === selectedMarketCode) || null;
  }, [marketSips, selectedMarketCode]);

  const activeBasket = useMemo(() => {
    return baskets.find((b) => b._id === selectedBasketId) || null;
  }, [baskets, selectedBasketId]);

  // Fast, flicker-free client-side tab switcher
  const handleModeSwitch = (mode) => {
    if (mode === creationMode) return;
    setCreationMode(mode);

    if (mode === "MARKET_SIP" && !selectedMarketCode && marketSips.length > 0) {
      setSelectedMarketCode(marketSips[0].code);
    } else if (mode === "CUSTOM_BASKET" && !selectedBasketId && baskets.length > 0) {
      setSelectedBasketId(baskets[0]._id);
    }
  };

  // Margin calculation
  const requiredMargin =
    creationMode === "MARKET_SIP"
      ? activeMarketPlan?.minAmount || 0
      : activeBasket?.marginRequired || 0;

  const availableMargin = parseFloat(
    funds?.equity?.availableMargin?.toString().replace(/,/g, "") || "124500"
  );
  const hasAdequateMargin = availableMargin >= requiredMargin;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const planName =
      creationMode === "MARKET_SIP"
        ? activeMarketPlan?.name || "Market SIP"
        : `${activeBasket?.name || "Custom Basket"} SIP`;

    setIsSubmitting(true);
    try {
      const payload = {
        userId: activeUserId,
        name: planName,
        frequency,
        scheduleDay: Number(scheduleDay),
        scheduleTime,
      };

      if (creationMode === "MARKET_SIP") {
        payload.marketSipCode = selectedMarketCode;
      } else {
        payload.basketId = selectedBasketId;
      }

      const res = await axios.post(`${API_BASE}/createSip`, payload);
      if (res.data?.success) {
        showToast(
          "Stock SIP Started!",
          `Started ${frequency.toLowerCase()} SIP: "${planName}".`,
          "success"
        );
        if (onSipCreated) onSipCreated(res.data.sip);
        onClose();
      }
    } catch (err) {
      showToast(
        "Creation Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sip-modal-overlay" onClick={onClose}>
      <div className="sip-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sip-modal-header">
          <div>
            <h3 className="sip-modal-title">Start Stock SIP</h3>
            <span className="sip-modal-subtitle">
              Choose from 50 verified market SIPs or link a custom basket
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Source Mode Switcher: 50 Real SIPs vs Custom Basket */}
        <div className="sip-mode-selector-bar">
          <button
            type="button"
            className={`sip-mode-pill ${creationMode === "MARKET_SIP" ? "active" : ""}`}
            onClick={() => handleModeSwitch("MARKET_SIP")}
          >
            ⭐ 50 Real Market SIPs (No Basket Needed)
          </button>
          <button
            type="button"
            className={`sip-mode-pill ${creationMode === "CUSTOM_BASKET" ? "active" : ""}`}
            onClick={() => handleModeSwitch("CUSTOM_BASKET")}
          >
            🧺 My Custom Baskets ({baskets.length})
          </button>
        </div>

        {loading ? (
          <div className="sip-modal-loading">Loading market SIP catalog...</div>
        ) : (
          <form onSubmit={handleSubmit} className="sip-modal-form-wrapper">
            <div className="sip-modal-body">
              {/* Tab Switch Content Panel */}
              <div className="tab-switch-content-wrapper">
                {/* Mode A: 50 Real Market SIPs */}
                {creationMode === "MARKET_SIP" && (
                  <div className="sip-tab-panel animate-panel-fade">
                    <div className="sip-form-group">
                      <label className="sip-field-label">
                        SELECT REAL MARKET SIP (50 AVAILABLE) <span className="req">*</span>
                      </label>
                      <select
                        className="sip-select"
                        value={selectedMarketCode}
                        onChange={(e) => setSelectedMarketCode(e.target.value)}
                        required
                      >
                        <optgroup label="Top 25 Bluechip Stocks (Direct Equity)">
                          {marketSips
                            .filter((m) => m.category === "Bluechip Stock")
                            .map((m) => (
                              <option key={m.code} value={m.code}>
                                {m.symbol} • {m.name} (₹{Number(m.minAmount).toLocaleString("en-IN")})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Top 15 Index & Sectoral ETFs">
                          {marketSips
                            .filter((m) => m.category === "ETF & Index")
                            .map((m) => (
                              <option key={m.code} value={m.code}>
                                {m.symbol} • {m.name} (₹{Number(m.minAmount).toLocaleString("en-IN")})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="Top 10 Curated Thematic Strategies">
                          {marketSips
                            .filter((m) => m.category === "Thematic Strategy")
                            .map((m) => (
                              <option key={m.code} value={m.code}>
                                {m.name} (₹{Number(m.minAmount).toLocaleString("en-IN")})
                              </option>
                            ))}
                        </optgroup>
                      </select>

                      {activeMarketPlan && (
                        <div className="market-plan-preview-box">
                          <div className="preview-top-row">
                            <span className="plan-category-badge">{activeMarketPlan.category}</span>
                            <span className="plan-tag-badge">{activeMarketPlan.tag}</span>
                            <span className="plan-cagr-badge">📈 {activeMarketPlan.cagr3Yr} 3Y CAGR</span>
                            <span className="plan-risk-badge">Risk: {activeMarketPlan.risk}</span>
                          </div>
                          <p className="plan-desc-text">{activeMarketPlan.description}</p>
                          <div className="plan-instruments-text">
                            <span>Executes: </span>
                            <strong>
                              {activeMarketPlan.instruments
                                ?.map((i) => `${i.qty} qty ${i.symbol} @ ₹${Number(i.price).toLocaleString("en-IN")}`)
                                .join(" + ")}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode B: Custom Baskets */}
                {creationMode === "CUSTOM_BASKET" && (
                  <div className="sip-tab-panel animate-panel-fade">
                    <div className="sip-form-group">
                      <label className="sip-field-label">
                        SELECT CUSTOM BASKET <span className="req">*</span>
                      </label>
                      {baskets.length === 0 ? (
                        <div className="empty-basket-note">
                          No custom baskets found. Switch to <strong>50 Real Market SIPs</strong> above to start investing immediately.
                        </div>
                      ) : (
                        <>
                          <select
                            className="sip-select"
                            value={selectedBasketId}
                            onChange={(e) => setSelectedBasketId(e.target.value)}
                            required
                          >
                            {baskets.map((b) => (
                              <option key={b._id} value={b._id}>
                                {b.name} ({b.items?.length || 0} orders • ₹{Number(b.marginRequired || 0).toLocaleString("en-IN")})
                              </option>
                            ))}
                          </select>
                          {activeBasket && (
                            <div className="basket-preview-pill">
                              <span>Contains {activeBasket.items?.length} items:</span>{" "}
                              <strong>
                                {activeBasket.items?.map((item) => `${item.symbol} (${item.qty})`).join(", ")}
                              </strong>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Frequency Selector */}
              <div className="sip-form-group">
                <label className="sip-field-label">FREQUENCY</label>
                <div className="frequency-toggle-group">
                  <button
                    type="button"
                    className={`freq-btn ${frequency === "MONTHLY" ? "active" : ""}`}
                    onClick={() => setFrequency("MONTHLY")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`freq-btn ${frequency === "WEEKLY" ? "active" : ""}`}
                    onClick={() => setFrequency("WEEKLY")}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={`freq-btn ${frequency === "DAILY" ? "active" : ""}`}
                    onClick={() => setFrequency("DAILY")}
                  >
                    Daily (Trading Days)
                  </button>
                </div>
              </div>

              {/* Schedule Day & Time Grid */}
              <div className="sip-grid-2">
                {frequency === "MONTHLY" && (
                  <div className="sip-form-group">
                    <label className="sip-field-label">DAY OF MONTH</label>
                    <select
                      className="sip-select"
                      value={scheduleDay}
                      onChange={(e) => setScheduleDay(Number(e.target.value))}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                          {d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of every month
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {frequency === "WEEKLY" && (
                  <div className="sip-form-group">
                    <label className="sip-field-label">DAY OF WEEK</label>
                    <select
                      className="sip-select"
                      value={scheduleDay}
                      onChange={(e) => setScheduleDay(Number(e.target.value))}
                    >
                      {WEEK_DAYS.map((w) => (
                        <option key={w.value} value={w.value}>
                          Every {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sip-form-group">
                  <label className="sip-field-label">EXECUTION TIME</label>
                  <select
                    className="sip-select"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  >
                    {TIME_PRESETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="sip-margin-summary">
                <div className="summary-row">
                  <span className="summary-label">Installment Amount:</span>
                  <span className="summary-value">₹{Number(requiredMargin).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Your Available Margin:</span>
                  <span className="summary-value" style={{ color: hasAdequateMargin ? "#16a34a" : "#dc2626" }}>
                    ₹{Number(availableMargin).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {!hasAdequateMargin && (
                  <div className="margin-warning-note">
                    ⚠️ Note: Your current cash is below this installment amount. You can start the SIP now, but ensure funds are added before execution to prevent skipped orders.
                  </div>
                )}
              </div>

              {/* SEBI Compliance Notice */}
              <div className="sip-compliance-note">
                Orders are placed automatically at market prices as CNC (Cash 'n' Carry) orders. In case of insufficient margin, you will receive an immediate email alert and push notification without cancellation of your SIP.
              </div>
            </div>

            {/* Pinned Action Footer */}
            <div className="sip-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-create-sip"
                disabled={isSubmitting || (creationMode === "CUSTOM_BASKET" && baskets.length === 0)}
              >
                {isSubmitting ? "Starting..." : "Start Stock SIP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SipCreateModal;
