import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import "./AlertCreateModal.css";

const API_BASE = "http://localhost:3002";

const AlertCreateModal = ({
  isOpen,
  onClose,
  onAlertSaved,
  editAlert = null,
  initialSymbol = "RELIANCE",
  activeUserId = null,
}) => {
  const [instruments, setInstruments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingInstruments, setIsLoadingInstruments] = useState(false);

  // Form State
  const [conditionType, setConditionType] = useState(editAlert ? editAlert.conditionType : "GTE");
  const [targetPrice, setTargetPrice] = useState(editAlert ? editAlert.targetPrice : "");
  const [targetPercentage, setTargetPercentage] = useState(editAlert ? editAlert.targetPercentage : 2.5);
  const [notes, setNotes] = useState(editAlert ? editAlert.notes : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const searchWrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // 1. Fetch Master Instruments from Backend
  useEffect(() => {
    let isMounted = true;
    setIsLoadingInstruments(true);

    const loadInstruments = async () => {
      try {
        let rawList = [];
        try {
          const res1 = await axios.get(`${API_BASE}/allInstruments`);
          if (Array.isArray(res1.data) && res1.data.length > 0) {
            rawList = res1.data;
          }
        } catch (e) {}

        if (rawList.length === 0) {
          try {
            const res2 = await axios.get(`${API_BASE}/masterInstruments?limit=200`);
            if (Array.isArray(res2.data) && res2.data.length > 0) {
              rawList = res2.data;
            }
          } catch (e) {}
        }

        if (!isMounted) return;

        const normalized = rawList.map((i) => {
          const sym = (i.symbol || i.name || "").toUpperCase();
          const fullName = i.name && i.name !== sym ? i.name : (i.sector || "Equity Instrument");
          const price = Number(i.price || i.ltp || 100);
          return {
            ...i,
            symbol: sym,
            name: fullName,
            fullName,
            price,
            ltp: price,
            exchange: i.exchange || "NSE",
            sector: i.sector || "Equity",
          };
        });

        setInstruments(normalized);

        // Pre-select initial stock
        const targetSym = (editAlert ? editAlert.symbol : initialSymbol || "RELIANCE").toUpperCase();
        const found = normalized.find((i) => i.symbol === targetSym || i.name?.toUpperCase() === targetSym);
        const initialStock = found || normalized[0] || null;

        if (initialStock) {
          setSelectedStock(initialStock);
          if (!editAlert) {
            const ltp = initialStock.price || 1000;
            setTargetPrice(Math.round(ltp * 1.02 * 100) / 100);
          }
        }
      } catch (err) {
        console.error("Failed to load instruments for alert modal:", err);
      } finally {
        if (isMounted) setIsLoadingInstruments(false);
      }
    };

    loadInstruments();

    return () => {
      isMounted = false;
    };
  }, [editAlert, initialSymbol]);

  // Handle stock selection
  const handleSelectStock = (inst) => {
    setSelectedStock(inst);
    setSearchTerm("");
    setIsDropdownOpen(false);
    const ltp = inst.price || inst.ltp || 1000;
    if (conditionType === "GTE") {
      setTargetPrice(Math.round(ltp * 1.02 * 100) / 100);
    } else if (conditionType === "LTE") {
      setTargetPrice(Math.round(ltp * 0.98 * 100) / 100);
    }
  };

  // Quick preset offsets (+1%, +2%, +5%, -2%, -5%)
  const applyPreset = (pct) => {
    if (!selectedStock) return;
    const ltp = selectedStock.price || selectedStock.ltp || 1000;
    const newPrice = Math.round(ltp * (1 + pct / 100) * 100) / 100;
    setTargetPrice(newPrice);
    if (pct >= 0) {
      setConditionType("GTE");
    } else {
      setConditionType("LTE");
    }
  };

  // Filtered stocks for dropdown search
  const filteredStocks = useMemo(() => {
    if (!searchTerm.trim()) {
      // If no search query, show top popular bluechips by default
      const popular = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "TATAMOTORS"];
      const popularMatches = instruments.filter((i) => popular.includes(i.symbol));
      return popularMatches.length > 0 ? popularMatches : instruments.slice(0, 8);
    }
    const q = searchTerm.trim().toLowerCase();
    return instruments
      .filter((i) => {
        const sym = (i.symbol || "").toLowerCase();
        const full = (i.fullName || i.name || "").toLowerCase();
        const sector = (i.sector || "").toLowerCase();
        return sym.includes(q) || full.includes(q) || sector.includes(q);
      })
      .slice(0, 10);
  }, [instruments, searchTerm]);

  // Proximity computation
  const currentLtp = selectedStock ? (selectedStock.price || selectedStock.ltp || 0) : 0;
  const numTarget = parseFloat(targetPrice) || 0;
  const diffPct = currentLtp > 0 ? ((numTarget - currentLtp) / currentLtp) * 100 : 0;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStock) {
      setErrorMsg("Please select a valid instrument.");
      return;
    }

    if (conditionType === "GTE" || conditionType === "LTE") {
      if (!numTarget || numTarget <= 0) {
        setErrorMsg("Please enter a valid target price greater than ₹0.");
        return;
      }
    } else {
      if (!targetPercentage || targetPercentage <= 0) {
        setErrorMsg("Please enter a valid percentage threshold.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editAlert) {
        // Update existing alert
        const res = await axios.put(`${API_BASE}/updateAlert/${editAlert._id}`, {
          conditionType,
          targetPrice: numTarget,
          targetPercentage: Number(targetPercentage),
          notes,
        });
        if (res.data?.success) {
          onAlertSaved("Alert Updated", `Price alert for ${selectedStock.symbol || selectedStock.name} modified.`);
          onClose();
        }
      } else {
        // Create new alert
        const res = await axios.post(`${API_BASE}/createAlert`, {
          userId: activeUserId,
          symbol: selectedStock.symbol,
          name: selectedStock.fullName || selectedStock.name || selectedStock.symbol,
          conditionType,
          targetPrice: numTarget,
          targetPercentage: Number(targetPercentage),
          notes,
        });
        if (res.data?.success) {
          onAlertSaved("Alert Created", `Price alert set for ${selectedStock.symbol}.`);
          onClose();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save alert");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="alert-modal-header">
          <div className="alert-modal-title-row">
            <span className="alert-modal-icon-badge">🔔</span>
            <div>
              <h3 className="alert-modal-title">{editAlert ? "Edit Price Alert" : "Set New Price Alert"}</h3>
              <span className="alert-modal-subtitle">
                Sentinel Real-Time Market Intelligence (NSE)
              </span>
            </div>
          </div>
          <button className="alert-modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="alert-modal-body">
          {errorMsg && <div className="alert-error-banner">{errorMsg}</div>}

          {/* 1. Stock Selector */}
          <div className="alert-form-group">
            <label className="alert-label">
              Select Instrument ({instruments.length > 0 ? `${instruments.length} Master Stocks` : "104 Master Stocks"})
            </label>
            <div className="alert-search-wrapper" ref={searchWrapperRef}>
              <div className="alert-input-container">
                <input
                  type="text"
                  placeholder={
                    selectedStock
                      ? `${selectedStock.symbol} — ${selectedStock.fullName} (Click to change stock)`
                      : "Search by stock name or symbol (e.g. INFY, RELIANCE, TCS)..."
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="alert-search-input"
                  disabled={Boolean(editAlert)}
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="alert-search-clear"
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && !editAlert && (
                <div className="alert-search-dropdown">
                  <div className="alert-dropdown-header">
                    <span>{searchTerm ? `Matching results (${filteredStocks.length})` : "Popular Bluechips"}</span>
                    {isLoadingInstruments && <span className="alert-loading-hint">Loading...</span>}
                  </div>
                  {filteredStocks.length > 0 ? (
                    filteredStocks.map((inst, idx) => (
                      <div
                        key={inst._id || inst.symbol || idx}
                        className={`alert-search-item ${selectedStock?.symbol === inst.symbol ? "selected" : ""}`}
                        onClick={() => handleSelectStock(inst)}
                      >
                        <div className="stock-sym-col">
                          <strong className="stock-sym">{inst.symbol}</strong>
                          <span className="stock-badge-nse">{inst.exchange || "NSE"}</span>
                        </div>
                        <div className="stock-meta-col">
                          <span className="stock-full">{inst.fullName || inst.name}</span>
                          <span className="stock-sector-tag">{inst.sector || "Equity"}</span>
                        </div>
                        <div className="stock-price-col">
                          <span className="stock-price">₹{Number(inst.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="alert-search-empty">
                      <span>No stocks found matching "{searchTerm}". Try "INFY", "RELIANCE", or "TCS".</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Stock Preview Card */}
            {selectedStock && (
              <div className="alert-stock-card">
                <div className="alert-stock-info">
                  <span className="stock-tag">{selectedStock.symbol}</span>
                  <span className="stock-exchange">{selectedStock.exchange || "NSE"}</span>
                  <span className="stock-name-text">{selectedStock.fullName || selectedStock.name}</span>
                </div>
                <div className="alert-stock-ltp">
                  <span className="ltp-label">Current LTP</span>
                  <strong className="ltp-value">
                    ₹{Number(currentLtp).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 2. Condition Selector */}
          <div className="alert-form-group">
            <label className="alert-label">Trigger Condition</label>
            <div className="alert-condition-grid">
              <button
                type="button"
                className={`cond-card ${conditionType === "GTE" ? "active" : ""}`}
                onClick={() => setConditionType("GTE")}
              >
                <span className="cond-symbol">≥</span>
                <span className="cond-title">Rises Above</span>
                <span className="cond-sub">LTP ≥ Target</span>
              </button>
              <button
                type="button"
                className={`cond-card ${conditionType === "LTE" ? "active" : ""}`}
                onClick={() => setConditionType("LTE")}
              >
                <span className="cond-symbol">≤</span>
                <span className="cond-title">Drops Below</span>
                <span className="cond-sub">LTP ≤ Target</span>
              </button>
              <button
                type="button"
                className={`cond-card ${conditionType === "PCT_UP" ? "active" : ""}`}
                onClick={() => setConditionType("PCT_UP")}
              >
                <span className="cond-symbol">+%</span>
                <span className="cond-title">Gains By</span>
                <span className="cond-sub">Change ≥ +X%</span>
              </button>
              <button
                type="button"
                className={`cond-card ${conditionType === "PCT_DOWN" ? "active" : ""}`}
                onClick={() => setConditionType("PCT_DOWN")}
              >
                <span className="cond-symbol">-%</span>
                <span className="cond-title">Drops By</span>
                <span className="cond-sub">Change ≤ -X%</span>
              </button>
            </div>
          </div>

          {/* 3. Target Input */}
          {(conditionType === "GTE" || conditionType === "LTE") ? (
            <div className="alert-form-group">
              <div className="label-with-presets">
                <label className="alert-label">Target Price (₹)</label>
                <div className="quick-presets">
                  <button type="button" onClick={() => applyPreset(1)}>+1%</button>
                  <button type="button" onClick={() => applyPreset(2)}>+2%</button>
                  <button type="button" onClick={() => applyPreset(5)}>+5%</button>
                  <button type="button" onClick={() => applyPreset(-2)}>-2%</button>
                  <button type="button" onClick={() => applyPreset(-5)}>-5%</button>
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.05"
                placeholder="e.g. 2850.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="alert-input-price"
                required
              />

              {/* Dynamic distance callout */}
              {numTarget > 0 && currentLtp > 0 && (
                <div className="alert-distance-pill">
                  <span>Target is </span>
                  <strong className={diffPct >= 0 ? "text-blue" : "text-amber"}>
                    {diffPct >= 0 ? `+${diffPct.toFixed(2)}%` : `${diffPct.toFixed(2)}%`}
                  </strong>
                  <span> ({Math.abs(numTarget - currentLtp).toFixed(2)} pts) from current market price</span>
                </div>
              )}
            </div>
          ) : (
            <div className="alert-form-group">
              <label className="alert-label">Target Day Percentage Threshold (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 3.0"
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(e.target.value)}
                className="alert-input-price"
                required
              />
            </div>
          )}

          {/* 4. Notes / Trading Strategy */}
          <div className="alert-form-group">
            <label className="alert-label">Tactical Note / Memo (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Breakout above resistance, consider booking 50% profit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="alert-input-text"
              maxLength={120}
            />
          </div>

          {/* Notification Badges Notice */}
          <div className="alert-channels-card">
            <span className="channels-title">Notification Channels Active:</span>
            <div className="channels-list">
              <span className="channel-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                </svg>
                In-App Bell Alert
              </span>
              <span className="channel-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Nodemailer Email
              </span>
              <span className="channel-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                Kite Audio Chime
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="alert-modal-footer">
            <button type="button" className="btn-alert-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-alert-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="alert-spinner"></span>
                  <span>{editAlert ? "Updating Alert..." : "Setting Alert..."}</span>
                </>
              ) : (
                <span>{editAlert ? "Update Alert" : "Set Price Alert"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertCreateModal;
