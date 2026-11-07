import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { useMarketFeed } from "../context/MarketFeedContext";
import AccountStatusBanner from "./common/AccountStatusBanner";
import PositionsAnalyticsModal from "./overlays/PositionsAnalyticsModal";
import RmsPolicyModal from "./overlays/RmsPolicyModal";
import ConvertPositionModal from "./overlays/ConvertPositionModal";
import SquareOffAllModal from "./overlays/SquareOffAllModal";
import {
  exportPositionsToCSV,
  exportPositionsToExcel,
  exportPositionsToPDF,
} from "../utils/PositionsExportUtils";

import "./Positions.css";

const API_BASE = "http://localhost:3002";

const Positions = () => {
  const {
    portfolioTrigger,
    currentUser,
    refreshPortfolio,
    openBuyWindow,
    openDepthModal,
    openGttModal,
    showToast,
  } = useContext(GeneralContext);

  const { quotes } = useMarketFeed();

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subTab, setSubTab] = useState("all"); // "all" | "mis" | "overnight"
  const [availableMargin, setAvailableMargin] = useState(0);
  const [usedMargin, setUsedMargin] = useState(0);

  // Sorting
  const [sortField, setSortField] = useState("pnl");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modals & Drawers
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isRmsModalOpen, setIsRmsModalOpen] = useState(false);
  const [isSquareOffAllOpen, setIsSquareOffAllOpen] = useState(false);
  const [positionToConvert, setPositionToConvert] = useState(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [openRowMenuSymbol, setOpenRowMenuSymbol] = useState(null);
  const [isSquaringOffId, setIsSquaringOffId] = useState(null);

  const exportDropdownRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
      if (!e.target.closest(".pos-more-menu-container")) {
        setOpenRowMenuSymbol(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Positions
  const fetchPositions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/allPositions`, {
        params: { userId: currentUser?.userId },
      });
      if (Array.isArray(res.data)) {
        setPositions(res.data);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.warn("Could not load positions:", err.message);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch Funds for margin conversions
  useEffect(() => {
    if (currentUser?.userId) {
      axios
        .get(`${API_BASE}/userFunds`, { params: { userId: currentUser.userId } })
        .then((res) => {
          if (res.data?.equity?.availableMargin !== undefined) {
            const raw = res.data.equity.availableMargin;
            const parsed = typeof raw === "string" ? parseFloat(raw.replace(/,/g, "")) : Number(raw || 0);
            setAvailableMargin(isNaN(parsed) ? 0 : parsed);
          }
          if (res.data?.equity?.usedMargin !== undefined) {
            const raw = res.data.equity.usedMargin;
            const parsed = typeof raw === "string" ? parseFloat(raw.replace(/,/g, "")) : Number(raw || 0);
            setUsedMargin(isNaN(parsed) ? 0 : parsed);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, portfolioTrigger]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions, portfolioTrigger]);

  // Filtered & Partitioned Positions
  const { openPositions, closedPositions, counts } = useMemo(() => {
    let openMis = 0;
    let closedMis = 0;
    let openOvernight = 0;
    let closedOvernight = 0;

    const open = [];
    const closed = [];

    positions.forEach((p) => {
      const prod = (p.product || "MIS").toUpperCase();
      const isOpen = Number(p.qty) !== 0;

      if (prod === "MIS") {
        if (isOpen) openMis++;
        else closedMis++;
      } else {
        if (isOpen) openOvernight++;
        else closedOvernight++;
      }

      // Filter by subTab
      if (subTab === "mis" && prod !== "MIS") return;
      if (subTab === "overnight" && prod === "MIS") return;

      // Filter by search
      const sym = (p.instrument || p.name || "").toLowerCase();
      if (searchTerm && !sym.includes(searchTerm.toLowerCase())) return;

      if (isOpen) {
        open.push(p);
      } else {
        closed.push(p);
      }
    });

    const totalOpen = openMis + openOvernight;
    const totalClosed = closedMis + closedOvernight;

    return {
      openPositions: open,
      closedPositions: closed,
      counts: {
        all: totalOpen,
        allClosed: totalClosed,
        mis: openMis,
        misClosed: closedMis,
        overnight: openOvernight,
        overnightClosed: closedOvernight,
      },
    };
  }, [positions, subTab, searchTerm]);

  // Handle Header Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sort Open Positions
  const sortedOpenPositions = useMemo(() => {
    return [...openPositions].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "pnl") {
        const liveA = quotes[a.instrument || a.name];
        const liveB = quotes[b.instrument || b.name];
        const ltpA = liveA ? liveA.price : (a.ltp || a.price || a.avg);
        const ltpB = liveB ? liveB.price : (b.ltp || b.price || b.avg);
        valA = a.qty > 0 ? (ltpA - a.avg) * a.qty : (a.avg - ltpA) * Math.abs(a.qty);
        valB = b.qty > 0 ? (ltpB - b.avg) * b.qty : (b.avg - ltpB) * Math.abs(b.qty);
      } else if (sortField === "instrument") {
        valA = (a.instrument || a.name || "").toLowerCase();
        valB = (b.instrument || b.name || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [openPositions, sortField, sortDirection, quotes]);

  // Real-time P&L Calculations
  const { totalUnrealizedPnl, totalRealizedPnl, totalDayPnl } = useMemo(() => {
    let unReal = 0;
    let real = 0;

    openPositions.forEach((pos) => {
      const sym = pos.instrument || pos.name;
      const live = quotes[sym];
      const ltp = live ? live.price : (pos.ltp || pos.price || pos.avg || 0);
      const avg = pos.avg || ltp;
      const qty = pos.qty || 0;
      if (qty > 0) {
        unReal += (ltp - avg) * qty;
      } else {
        unReal += (avg - ltp) * Math.abs(qty);
      }
    });

    positions.forEach((p) => {
      real += Number(p.realizedPnl || 0);
    });

    return {
      totalUnrealizedPnl: unReal,
      totalRealizedPnl: real,
      totalDayPnl: unReal + real,
    };
  }, [openPositions, positions, quotes]);

  // Single Position Square Off Handler
  const handleSingleSquareOff = async (pos) => {
    const sym = pos.instrument || pos.name;
    const live = quotes[sym];
    const ltp = live ? live.price : (pos.ltp || pos.price || pos.avg);

    setIsSquaringOffId(pos._id);
    try {
      const res = await axios.post(`${API_BASE}/squareOffPosition`, {
        positionId: pos._id,
        exitPrice: ltp,
        userId: currentUser?.userId,
      });

      if (res.data && res.data.success) {
        showToast("Position Squared Off", res.data.message, "success");
        refreshPortfolio();
        fetchPositions();
      } else {
        showToast("Square Off Failed", res.data?.message || "Failed to close position", "error");
      }
    } catch (err) {
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSquaringOffId(null);
    }
  };

  return (
    <div className="positions-page-container">
      {/* Risk Management / Intraday Square-off Banner */}
      <AccountStatusBanner
        message="Account status: Intraday square-off begins at 15:20 for equity MIS and 15:25 for F&O."
        linkText="RMS policy rules"
        onLinkClick={() => setIsRmsModalOpen(true)}
      />

      {/* Top Executive Positions Summary Card */}
      <div className="positions-hero-summary-card">
        <div className="pos-hero-item">
          <span className="pos-hero-label">Total Day P&L</span>
          <span className={`pos-hero-val ${totalDayPnl >= 0 ? "text-up" : "text-down"}`}>
            {totalDayPnl >= 0 ? "+" : ""}₹{totalDayPnl.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="pos-hero-sub">Combined realized + MTM</span>
        </div>

        <div className="pos-hero-item">
          <span className="pos-hero-label">Realized Day P&L</span>
          <span className={`pos-hero-val ${totalRealizedPnl >= 0 ? "text-up" : "text-down"}`}>
            {totalRealizedPnl >= 0 ? "+" : ""}₹{totalRealizedPnl.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="pos-hero-sub">Locked from squared-off lots</span>
        </div>

        <div className="pos-hero-item">
          <span className="pos-hero-label">Unrealized MTM P&L</span>
          <span className={`pos-hero-val ${totalUnrealizedPnl >= 0 ? "text-up" : "text-down"}`}>
            {totalUnrealizedPnl >= 0 ? "+" : ""}₹{totalUnrealizedPnl.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="pos-hero-sub">Live tick mark-to-market</span>
        </div>

        <div className="pos-hero-item no-border">
          <span className="pos-hero-label">Active Exposure</span>
          <span className="pos-hero-val">
            {openPositions.length} Open <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>({closedPositions.length} closed)</span>
          </span>
          <span className="pos-hero-sub">Current market lots</span>
        </div>
      </div>

      {/* Top Utility Bar */}
      <div className="positions-top-bar">
        <div className="positions-title-section">
          <h2 className="section-heading" style={{ margin: 0 }}>
            Positions ({openPositions.length})
          </h2>
        </div>

        <div className="positions-actions-right">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="positions-search-input"
          />

          {/* Analytics Modal Link */}
          <button
            type="button"
            className="subtle-link"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}
            onClick={() => setIsAnalyticsOpen(true)}
          >
            Analytics &rsaquo;
          </button>

          {/* Export Dropdown */}
          <div className="pos-export-container" ref={exportDropdownRef}>
            <button
              type="button"
              className="btn-pos-export"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
            >
              <span>Download</span>
              <span style={{ fontSize: "10px" }}>▼</span>
            </button>

            {isExportMenuOpen && (
              <div className="pos-export-dropdown-menu">
                <button
                  type="button"
                  className="pos-export-option"
                  onClick={() => {
                    exportPositionsToCSV(positions, currentUser, quotes);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📊 CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  className="pos-export-option"
                  onClick={() => {
                    exportPositionsToExcel(positions, currentUser, quotes);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📗 Excel Spreadsheet (.xls)</span>
                </button>
                <button
                  type="button"
                  className="pos-export-option"
                  onClick={() => {
                    exportPositionsToPDF(positions, currentUser, quotes);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📄 Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Exit All Positions (RMS Button) */}
          <button
            type="button"
            className="btn-exit-all"
            disabled={openPositions.length === 0}
            onClick={() => setIsSquareOffAllOpen(true)}
            title="Square off all open intraday and F&O positions"
          >
            <span>⚡ Exit all positions</span>
            {openPositions.length > 0 && <span>({openPositions.length})</span>}
          </button>
        </div>
      </div>

      {/* Subtabs Filter Bar */}
      <div className="positions-subtabs-bar">
        <button
          type="button"
          className={`pos-subtab-btn ${subTab === "all" ? "active" : ""}`}
          onClick={() => setSubTab("all")}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className={`pos-subtab-btn ${subTab === "mis" ? "active" : ""}`}
          onClick={() => setSubTab("mis")}
        >
          Day / MIS ({counts.mis})
        </button>
        <button
          type="button"
          className={`pos-subtab-btn ${subTab === "overnight" ? "active" : ""}`}
          onClick={() => setSubTab("overnight")}
        >
          Overnight / NRML ({counts.overnight})
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-center text-muted">Loading positions from database...</div>
      ) : openPositions.length === 0 && closedPositions.length === 0 ? (
        <div className="empty-state-view">
          <div className="empty-state-illustration">
            <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
          </div>
          <h4 className="empty-state-title">
            {subTab === "overnight" ? "No overnight / NRML positions" : "No positions found"}
          </h4>
          <p className="empty-state-subtitle">
            {subTab === "overnight"
              ? "Overnight / NRML positions include F&O contracts held until expiry, or intraday MIS positions converted to carry forward across trading days without 15:20 auto square-off."
              : "You do not have any open or closed intraday positions today. Place an MIS order from the watchlist to trade."}
          </p>
          {subTab === "overnight" && (
            <button
              type="button"
              className="btn-pos-action add-pos"
              style={{ marginTop: "12px", padding: "6px 16px", fontSize: "13px", fontWeight: 600, borderRadius: "4px" }}
              onClick={() => openBuyWindow("NIFTY 24500 CE", "BUY", 125.40)}
            >
              + Place Sample Overnight NRML Order
            </button>
          )}
        </div>
      ) : (
        <>
          {/* SECTION 1: Open Positions */}
          <div className="positions-section-card">
            <div className="positions-section-header">
              <h4>
                <span>Open Positions</span>
                <span className="badge-open-count">{openPositions.length}</span>
              </h4>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Unrealized MTM P&L:{" "}
                <strong style={{ color: totalUnrealizedPnl >= 0 ? "#10b981" : "#ef4444" }}>
                  {totalUnrealizedPnl >= 0 ? "+" : ""}₹{totalUnrealizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
            </div>

            {openPositions.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b", background: "#fafafa", borderRadius: "6px", margin: "16px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  No active open positions
                </div>
                <div style={{ fontSize: "13px", maxWidth: "520px", margin: "0 auto 16px auto", lineHeight: "1.5" }}>
                  To take a new intraday position, hover over any instrument in your <strong>Watchlist</strong> on the left and click <strong>B</strong> (Buy) or <strong>S</strong> (Sell) with <strong>Intraday MIS (5x leverage)</strong> selected.
                </div>
                <button
                  type="button"
                  className="btn-pos-action add-pos"
                  style={{ display: "inline-flex", padding: "6px 16px", fontSize: "13px", fontWeight: 600, borderRadius: "4px" }}
                  onClick={() => openBuyWindow("INFY", "BUY", quotes["INFY"]?.price || 1845.50)}
                >
                  + Open New MIS Position (INFY)
                </button>
              </div>
            ) : (
              <div className="kite-table-container">
                <table className="kite-data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="sortable-th" onClick={() => handleSort("instrument")}>
                        Instrument
                        <span className={`sort-arrow ${sortField === "instrument" ? "active" : "inactive"}`}>
                          {sortField === "instrument" && sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      </th>
                      <th>Qty.</th>
                      <th>Avg.</th>
                      <th>LTP</th>
                      <th className="sortable-th" onClick={() => handleSort("pnl")}>
                        P&L
                        <span className={`sort-arrow ${sortField === "pnl" ? "active" : "inactive"}`}>
                          {sortField === "pnl" && sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      </th>
                      <th>Chg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOpenPositions.map((pos, idx) => {
                      const symbol = pos.instrument || pos.name;
                      const avg = Number(pos.avg || pos.price || 0);
                      const qty = Number(pos.qty || 0);
                      const live = quotes[symbol];
                      const ltp = live ? live.price : Number(pos.ltp || pos.price || avg);
                      const pnl = qty > 0 ? (ltp - avg) * qty : (avg - ltp) * Math.abs(qty);
                      const isProfit = pnl >= 0;
                      const chg = live ? live.percent : (pos.chg || pos.net || "0.00%");

                      let flashClass = "";
                      if (live?.tickDirection === "up") flashClass = "pos-tick-up";
                      else if (live?.tickDirection === "down") flashClass = "pos-tick-down";

                      return (
                        <tr key={pos._id || symbol || idx} className="positions-table-row">
                          {/* Product Pill */}
                          <td>
                            <span className="product-tag">{pos.product || "MIS"}</span>
                          </td>

                          {/* Instrument with Hover Drawer */}
                          <td className="symbol-cell">
                            <div className="pos-symbol-wrapper">
                              <span className="pos-symbol-name">{symbol}</span>

                              {/* Hover Action Drawer */}
                              <div className="positions-hover-actions">
                                <button
                                  type="button"
                                  className="btn-pos-action btn-pos-add"
                                  onClick={() => openBuyWindow(symbol, qty >= 0 ? "BUY" : "SELL", ltp)}
                                  title="Add to position"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  className="btn-pos-action btn-pos-exit"
                                  disabled={isSquaringOffId === pos._id}
                                  onClick={() => handleSingleSquareOff(pos)}
                                  title="Square off position at market price"
                                >
                                  {isSquaringOffId === pos._id ? "Exiting..." : "Exit"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-pos-action btn-pos-convert"
                                  onClick={() => setPositionToConvert(pos)}
                                  title="Convert MIS to CNC or vice-versa"
                                >
                                  Convert
                                </button>
                                <button
                                  type="button"
                                  className="btn-pos-action btn-pos-depth"
                                  onClick={() => openDepthModal(symbol)}
                                  title="Market Depth"
                                >
                                  Depth
                                </button>

                                {/* More Menu */}
                                <div className="pos-more-menu-container" style={{ position: "relative" }}>
                                  <button
                                    type="button"
                                    className="btn-pos-action btn-pos-more"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenRowMenuSymbol((prev) => (prev === symbol ? null : symbol));
                                    }}
                                  >
                                    •••
                                  </button>

                                  {openRowMenuSymbol === symbol && (
                                    <div className="pos-more-dropdown">
                                      <button
                                        type="button"
                                        className="pos-dropdown-item"
                                        onClick={() => {
                                          openGttModal(symbol, ltp);
                                          setOpenRowMenuSymbol(null);
                                        }}
                                      >
                                        🎯 Set GTT / Stoploss
                                      </button>
                                      <button
                                        type="button"
                                        className="pos-dropdown-item"
                                        onClick={() => {
                                          showToast("Alert", `Opening price alert for ${symbol}`, "info");
                                          setOpenRowMenuSymbol(null);
                                        }}
                                      >
                                        🔔 Create Price Alert
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Net Qty */}
                          <td className={qty >= 0 ? "text-up" : "text-down"} style={{ fontWeight: 600 }}>
                            {qty > 0 ? `+${qty}` : qty}
                          </td>

                          {/* Avg Execution Price */}
                          <td>{avg.toFixed(2)}</td>

                          {/* LTP with live flash */}
                          <td className={flashClass} style={{ fontWeight: 600 }}>
                            {ltp.toFixed(2)}
                          </td>

                          {/* Live Unrealized P&L */}
                          <td className={isProfit ? "text-up" : "text-down"} style={{ fontWeight: 700 }}>
                            {isProfit ? "+" : ""}
                            {pnl.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          {/* Day % Change */}
                          <td className={chg.startsWith("-") ? "text-down" : "text-up"}>
                            {chg}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: Closed / Squared-Off Positions */}
          {closedPositions.length > 0 && (
            <div className="positions-section-card">
              <div className="positions-section-header" style={{ background: "#f8fafc" }}>
                <h4>
                  <span>Closed Positions</span>
                  <span className="badge-closed-count">{closedPositions.length}</span>
                </h4>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Day Realized P&L:{" "}
                  <strong style={{ color: totalRealizedPnl >= 0 ? "#10b981" : "#ef4444" }}>
                    {totalRealizedPnl >= 0 ? "+" : ""}₹{totalRealizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>

              <div className="kite-table-container">
                <table className="kite-data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Instrument</th>
                      <th>Net Qty</th>
                      <th>Avg Entry</th>
                      <th>Exit Price</th>
                      <th>Realized P&L</th>
                      <th>Closed Time</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions.map((pos, idx) => {
                      const sym = pos.instrument || pos.name;
                      const live = quotes[sym];
                      const currentLtp = live ? live.price : (pos.ltp || pos.price || pos.avg || 0);
                      const realPnl = Number(pos.realizedPnl || pos.pnl || 0);
                      const isProfit = realPnl >= 0;
                      const closedTime = pos.closedAt
                        ? new Date(pos.closedAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Today";

                      return (
                        <tr key={pos._id || idx} style={{ color: "#64748b" }}>
                          <td>
                            <span className="product-tag" style={{ background: "#f1f5f9", color: "#64748b" }}>
                              {pos.product || "MIS"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "#334155" }}>{sym}</td>
                          <td>0 (Squared Off)</td>
                          <td>{pos.avg ? pos.avg.toFixed(2) : "-"}</td>
                          <td>{pos.ltp ? pos.ltp.toFixed(2) : "-"}</td>
                          <td style={{ fontWeight: 700, color: isProfit ? "#10b981" : "#ef4444" }}>
                            {isProfit ? "+" : ""}
                            {realPnl.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ fontSize: "12px" }}>{closedTime}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-pos-action add-pos"
                              style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "3px" }}
                              onClick={() => openBuyWindow(sym, "BUY", currentLtp)}
                              title={`Place new intraday order for ${sym}`}
                            >
                              + Trade
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* End of Tables */}
        </>
      )}

      {/* MODALS */}
      {/* 1. Derivatives & Risk Analytics Modal */}
      <PositionsAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        positions={positions}
        quotes={quotes}
        availableMargin={availableMargin}
        usedMargin={usedMargin}
      />

      {/* 2. RMS Policy Rules Modal */}
      <RmsPolicyModal
        isOpen={isRmsModalOpen}
        onClose={() => setIsRmsModalOpen(false)}
      />

      {/* 3. Convert Position Modal */}
      <ConvertPositionModal
        isOpen={!!positionToConvert}
        onClose={() => setPositionToConvert(null)}
        position={positionToConvert}
        currentUser={currentUser}
        availableMargin={availableMargin}
        onConversionSuccess={(msg) => {
          showToast("Position Converted", msg, "success");
          refreshPortfolio();
          fetchPositions();
        }}
      />

      {/* 4. Square Off All Modal */}
      <SquareOffAllModal
        isOpen={isSquareOffAllOpen}
        onClose={() => setIsSquareOffAllOpen(false)}
        openPositions={openPositions}
        quotes={quotes}
        currentUser={currentUser}
        onSquareOffSuccess={(msg) => {
          showToast("All Positions Squared Off", msg, "success");
          refreshPortfolio();
          fetchPositions();
        }}
      />
    </div>
  );
};

export default Positions;
