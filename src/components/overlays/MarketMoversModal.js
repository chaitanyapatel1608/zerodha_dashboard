import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import { Tooltip, Grow } from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Search,
  BarChartOutlined,
  MoreHoriz,
  Add,
  Check,
} from "@mui/icons-material";
import "./MarketMoversModal.css";

const API_BASE = "http://localhost:3002";

const SEGMENT_TABS = [
  { id: "ALL", label: "All 100+ Stocks" },
  { id: "NIFTY 50", label: "NIFTY 50" },
  { id: "BANK NIFTY", label: "Bank Nifty" },
  { id: "NIFTY IT", label: "Nifty IT" },
];

const MarketMoversModal = ({ isOpen, type = "gainers", onClose }) => {
  const [activeType, setActiveType] = useState(type); // "gainers" | "losers"
  const [activeSegment, setActiveSegment] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [frozenList, setFrozenList] = useState([]);
  const [isReRanking, setIsReRanking] = useState(false);
  const [addedSymbols, setAddedSymbols] = useState(new Set());

  const { openBuyWindow, openDepthModal, showToast, currentUser, activeWatchlistGroup } = useContext(GeneralContext);
  const { quotes, registerStocks } = useMarketFeed();
  const navigate = useNavigate();

  const userId = currentUser?.userId;

  // Sync activeType if type prop changes
  useEffect(() => {
    if (type) setActiveType(type);
  }, [type]);

  // 1. Fetch master instruments universe on open
  useEffect(() => {
    if (isOpen) {
      axios
        .get(`${API_BASE}/masterInstruments?limit=150`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setMasterList(res.data);
            registerStocks(res.data);
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch master instruments:", err.message);
        });
    }
  }, [isOpen, registerStocks]);

  // Ranking calculation helper
  const calculateRanking = useCallback(
    (sourceList, targetType, segment) => {
      let filtered = sourceList;

      // Filter by sector / index segment
      if (segment === "NIFTY 50") {
        const niftySymbols = new Set([
          "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN",
          "BHARTIARTL", "ITC", "LT", "HINDUNILVR", "BAJFINANCE", "MARUTI",
          "SUNPHARMA", "TATAMOTORS", "AXISBANK", "KOTAKBANK", "NTPC",
          "ONGC", "TITAN", "TATASTEEL", "POWERGRID", "ADANIENT", "M&M"
        ]);
        filtered = filtered.filter((s) => niftySymbols.has(s.symbol));
      } else if (segment === "BANK NIFTY") {
        filtered = filtered.filter(
          (s) =>
            s.sector === "Banking" ||
            s.sector === "Financial Services" ||
            s.symbol.includes("BANK")
        );
      } else if (segment === "NIFTY IT") {
        filtered = filtered.filter((s) => s.sector === "Technology");
      }

      // Merge each item with latest live quote
      const merged = filtered.map((item) => {
        const live = quotes[item.symbol];
        const price = live ? live.price : item.price;
        const change = live ? live.change : item.change;
        const percentStr = live ? live.percent : item.percent;
        const isDown = live ? live.isDown : item.isDown;
        const tickDirection = live ? live.tickDirection : null;

        const numPct = parseFloat((percentStr || "0").replace(/[%+]/g, "")) || 0;
        const netPct = isDown ? -Math.abs(numPct) : Math.abs(numPct);

        return {
          ...item,
          price,
          change,
          percent: percentStr,
          isDown,
          tickDirection,
          numericPercent: netPct,
        };
      });

      // Sort according to targetType
      if (targetType === "gainers") {
        merged.sort((a, b) => b.numericPercent - a.numericPercent);
      } else {
        merged.sort((a, b) => a.numericPercent - b.numericPercent);
      }

      return merged;
    },
    [quotes]
  );

  // 2. Rank when masterList loads or when activeType / activeSegment changes
  useEffect(() => {
    if (masterList.length > 0) {
      const ranked = calculateRanking(masterList, activeType, activeSegment);
      setFrozenList(ranked);
    }
  }, [masterList, activeType, activeSegment, calculateRanking]);

  // Option A (Trader-Friendly): Manual Re-rank button trigger
  const handleManualReRank = () => {
    setIsReRanking(true);
    const reRanked = calculateRanking(masterList, activeType, activeSegment);
    setFrozenList(reRanked);
    showToast("Re-ranked", `Updated rankings for ${activeType.toUpperCase()}`, "info");
    setTimeout(() => {
      setIsReRanking(false);
    }, 600);
  };

  // Filter list by search query without changing rank order
  const displayList = useMemo(() => {
    if (!searchFilter.trim()) return frozenList;
    const q = searchFilter.toLowerCase();
    return frozenList.filter(
      (s) =>
        (s.symbol || "").toLowerCase().includes(q) ||
        (s.name || "").toLowerCase().includes(q) ||
        (s.sector || "").toLowerCase().includes(q)
    );
  }, [frozenList, searchFilter]);

  // Add stock to active watchlist tab
  const handleAddToWatchlist = async (e, stock) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`${API_BASE}/addWatchlistStock`, {
        userId,
        tabId: activeWatchlistGroup,
        stock,
      });
      if (res.data?.success) {
        setAddedSymbols((prev) => new Set([...prev, stock.symbol]));
        showToast("Added to Watchlist", `Added ${stock.symbol} to your active watchlist tab`, "success");
      }
    } catch (err) {
      showToast("Notice", err.response?.data?.message || "Could not add stock", "info");
    }
  };

  // Quick Action Handlers
  const handleBuy = (e, stock) => {
    e.stopPropagation();
    const live = quotes[stock.symbol]?.price || stock.price;
    openBuyWindow(stock.symbol, "BUY", live);
  };

  const handleSell = (e, stock) => {
    e.stopPropagation();
    const live = quotes[stock.symbol]?.price || stock.price;
    openBuyWindow(stock.symbol, "SELL", live);
  };

  const handleDepth = (e, symbol) => {
    e.stopPropagation();
    openDepthModal(symbol);
  };

  const handleChart = (e, symbol) => {
    e.stopPropagation();
    onClose();
    navigate(`/chart?symbol=${symbol}`);
  };

  if (!isOpen) return null;

  return (
    <div className="market-movers-overlay" onClick={onClose}>
      <div className="market-movers-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="market-movers-header">
          <div className="movers-header-left">
            <h3 className="movers-header-title">Market Movers</h3>
            <span className="movers-live-tag">
              <span className="live-dot"></span> LIVE TICKER
            </span>
          </div>
          <button className="movers-header-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Control Bar */}
        <div className="market-movers-control-bar">
          {/* Type Toggle: Gainers vs Losers */}
          <div className="movers-type-toggle">
            <button
              type="button"
              className={`movers-type-btn ${activeType === "gainers" ? "active gainers" : ""}`}
              onClick={() => setActiveType("gainers")}
            >
              <TrendingUp fontSize="small" /> Top Gainers
            </button>
            <button
              type="button"
              className={`movers-type-btn ${activeType === "losers" ? "active losers" : ""}`}
              onClick={() => setActiveType("losers")}
            >
              <TrendingDown fontSize="small" /> Top Losers
            </button>
          </div>

          {/* Segment Filter Pills (Option A) */}
          <div className="movers-segment-pills">
            {SEGMENT_TABS.map((seg) => (
              <button
                key={seg.id}
                type="button"
                className={`segment-pill-btn ${activeSegment === seg.id ? "active" : ""}`}
                onClick={() => setActiveSegment(seg.id)}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {/* Right Actions: Search & Re-rank */}
          <div className="movers-actions-right">
            <div className="movers-search-input-wrap">
              <Search className="movers-search-icon" />
              <input
                type="text"
                placeholder="Filter stocks..."
                className="movers-search-input"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={`btn-rerank ${isReRanking ? "spinning" : ""}`}
              onClick={handleManualReRank}
              title="Refresh and re-rank live positions"
            >
              <Refresh className="rerank-icon" fontSize="small" />
              <span>Re-rank</span>
            </button>
          </div>
        </div>

        {/* Freeze Notice Bar (Option A Trader-Friendly UX) */}
        <div className="movers-freeze-notice">
          <span>
            ⚡ Positions locked to prevent jumping under cursor. Prices update live with green/red flashes.
          </span>
          <span>Showing <strong>{displayList.length}</strong> instruments</span>
        </div>

        {/* Ranked Table Scroll Area */}
        <div className="movers-table-scroll-area">
          <table className="movers-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Rank</th>
                <th>Instrument</th>
                <th className="text-right">LTP (₹)</th>
                <th className="text-right">Change (₹)</th>
                <th className="text-right">% Change</th>
                <th className="text-right" style={{ width: "190px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((item, index) => {
                // Live tick prices
                const live = quotes[item.symbol];
                const displayPrice = live ? live.price : item.price;
                const displayChange = live ? live.change : item.change;
                const displayPercent = live ? live.percent : item.percent;
                const displayIsDown = live ? live.isDown : item.isDown;
                const tickDirection = live ? live.tickDirection : null;

                let flashClass = "";
                if (tickDirection === "up") flashClass = "tick-flash-up";
                else if (tickDirection === "down") flashClass = "tick-flash-down";

                const isAlreadyAdded = addedSymbols.has(item.symbol);

                return (
                  <tr key={item.symbol} onClick={(e) => handleBuy(e, item)}>
                    {/* Rank */}
                    <td>
                      <span className={`rank-badge rank-${index + 1}`}>
                        #{index + 1}
                      </span>
                    </td>

                    {/* Instrument Info */}
                    <td>
                      <div className="instrument-cell">
                        <div className="inst-symbol-row">
                          <span className="inst-sym">{item.symbol}</span>
                          <span className="inst-exchange">{item.exchange || "NSE"}</span>
                          {item.sector && <span className="inst-sector">{item.sector}</span>}
                        </div>
                        <span className="inst-name">{item.name}</span>
                      </div>
                    </td>

                    {/* LTP */}
                    <td className="text-right">
                      <span className={`ltp-val ${flashClass}`}>
                        ₹{Number(displayPrice).toFixed(2)}
                      </span>
                    </td>

                    {/* Change */}
                    <td className="text-right">
                      <span className={displayIsDown ? "text-down" : "text-up"}>
                        {Number(displayChange) > 0 ? "+" : ""}
                        {Number(displayChange).toFixed(2)}
                      </span>
                    </td>

                    {/* % Change */}
                    <td className="text-right">
                      <span className={`pct-badge ${displayIsDown ? "loss" : "gain"}`}>
                        {displayPercent}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="movers-row-actions">
                        <Tooltip title="Buy" arrow TransitionComponent={Grow}>
                          <button
                            className="mover-act-btn buy"
                            onClick={(e) => handleBuy(e, item)}
                          >
                            B
                          </button>
                        </Tooltip>
                        <Tooltip title="Sell" arrow TransitionComponent={Grow}>
                          <button
                            className="mover-act-btn sell"
                            onClick={(e) => handleSell(e, item)}
                          >
                            S
                          </button>
                        </Tooltip>
                        <Tooltip title="Technical Chart" arrow TransitionComponent={Grow}>
                          <button
                            className="mover-act-btn icon"
                            onClick={(e) => handleChart(e, item.symbol)}
                          >
                            <BarChartOutlined fontSize="inherit" />
                          </button>
                        </Tooltip>
                        <Tooltip title="Market Depth (Level 2)" arrow TransitionComponent={Grow}>
                          <button
                            className="mover-act-btn icon"
                            onClick={(e) => handleDepth(e, item.symbol)}
                          >
                            <MoreHoriz fontSize="inherit" />
                          </button>
                        </Tooltip>

                        {isAlreadyAdded ? (
                          <span className="badge-added-mover" title="Added to Watchlist">
                            <Check fontSize="inherit" /> Added
                          </span>
                        ) : (
                          <button
                            className="btn-add-watchlist-mover"
                            onClick={(e) => handleAddToWatchlist(e, item)}
                            title="Add to active watchlist tab"
                          >
                            <Add fontSize="inherit" /> Watchlist
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {displayList.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="movers-empty-state">
                      No instruments found matching "{searchFilter}".
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="market-movers-footer">
          <span>Click any row to open the Buy order ticket instantly</span>
          <button type="button" className="btn-kite-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketMoversModal;
