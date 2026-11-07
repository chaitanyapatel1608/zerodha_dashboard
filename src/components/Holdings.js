import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import GeneralContext from "./GeneralContext";
import { useMarketFeed } from "../context/MarketFeedContext";
import AccountStatusBanner from "./common/AccountStatusBanner";
import CdslAuthModal from "./overlays/CdslAuthModal";
import HoldingsAnalyticsModal from "./overlays/HoldingsAnalyticsModal";
import CdslEvotingModal from "./overlays/CdslEvotingModal";
import HoldingsBreakdownModal from "./overlays/HoldingsBreakdownModal";
import {
  exportHoldingsToCSV,
  exportHoldingsToExcel,
  exportHoldingsToPDF,
} from "../utils/HoldingsExportUtils";

import "./Holdings.css";

const API_BASE = "http://localhost:3002";

const CURATED_MUTUAL_FUNDS = [
  {
    code: "NIPPON_NIFTY50",
    name: "Nippon India Nifty 50 Index Fund",
    plan: "Direct Plan &bull; Growth",
    category: "Large Cap Index",
    cagr1Y: "+28.4%",
    cagr3Y: "+16.2%",
    nav: "₹39.40",
    aum: "₹14,200 Cr",
    minSip: "₹500",
    marketCode: "SIP_NIFTYBEES",
  },
  {
    code: "PPFAS_FLEXICAP",
    name: "Parag Parikh Flexi Cap Fund",
    plan: "Direct Plan &bull; Growth",
    category: "Flexi Cap Equity",
    cagr1Y: "+34.2%",
    cagr3Y: "+21.5%",
    nav: "₹78.90",
    aum: "₹68,500 Cr",
    minSip: "₹1,000",
    marketCode: "SIP_MOM50",
  },
  {
    code: "HDFC_SMALLCAP",
    name: "HDFC Small Cap Fund",
    plan: "Direct Plan &bull; Growth",
    category: "Small Cap Equity",
    cagr1Y: "+41.8%",
    cagr3Y: "+26.8%",
    nav: "₹142.10",
    aum: "₹32,000 Cr",
    minSip: "₹500",
    marketCode: "SIP_MID150BEES",
  },
  {
    code: "MIRAE_LARGEMID",
    name: "Mirae Asset Large & Midcap Fund",
    plan: "Direct Plan &bull; Growth",
    category: "Large & Mid Cap",
    cagr1Y: "+31.5%",
    cagr3Y: "+19.4%",
    nav: "₹125.60",
    aum: "₹38,100 Cr",
    minSip: "₹1,000",
    marketCode: "SIP_MID150BEES",
  },
];

const Holdings = () => {
  const {
    portfolioTrigger,
    currentUser,
    openBuyWindow,
    openDepthModal,
    openGttModal,
    showToast,
  } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(location.state?.defaultSubTab || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [holdings, setHoldings] = useState([]);
  const [userSips, setUserSips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync subtab from navigation state (e.g. from Orders)
  useEffect(() => {
    if (location.state?.defaultSubTab) {
      setActiveTab(location.state.defaultSubTab);
    }
  }, [location.state]);

  // Fetch active user SIPs from MongoDB Atlas (linking Coin / SIP holdings)
  useEffect(() => {
    const activeUserId = currentUser?.userId;
    if (activeUserId) {
      axios
        .get(`${API_BASE}/allSips`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setUserSips(res.data);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, portfolioTrigger]);

  const totalSipInvested = useMemo(() => {
    return userSips.reduce((acc, s) => acc + (Number(s.totalCapitalInvested) || 0), 0);
  }, [userSips]);

  // Sorting State
  const [sortField, setSortField] = useState("curVal");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modals & Popovers
  const [isCdslAuthModalOpen, setIsCdslAuthModalOpen] = useState(false);
  const [holdingForExit, setHoldingForExit] = useState(null);
  const [isCdslAuthorizedToday, setIsCdslAuthorizedToday] = useState(() => {
    return sessionStorage.getItem("cdsl_authorized_today") === "true";
  });
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isEvotingOpen, setIsEvotingOpen] = useState(false);
  const [breakdownHolding, setBreakdownHolding] = useState(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [openRowMenuSymbol, setOpenRowMenuSymbol] = useState(null);

  const exportDropdownRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
      if (!e.target.closest(".row-more-menu-container")) {
        setOpenRowMenuSymbol(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch holdings with active multi-tenant userId
  const fetchHoldings = useCallback(async () => {
    const activeUserId = currentUser?.userId;
    try {
      const res = await axios.get(`${API_BASE}/allHoldings`, {
        params: { userId: activeUserId },
      });
      if (Array.isArray(res.data)) {
        setHoldings(res.data);
      }
    } catch (err) {
      console.warn("Backend unavailable:", err.message);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings, portfolioTrigger]);

  // Handle Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter and Sort Holdings
  const processedHoldings = useMemo(() => {
    let list = holdings.filter((stock) => {
      const sym = (stock.instrument || stock.name || "").toLowerCase();
      return sym.includes(searchTerm.toLowerCase());
    });

    return list.sort((a, b) => {
      const symA = (a.instrument || a.name || "").toUpperCase();
      const symB = (b.instrument || b.name || "").toUpperCase();
      const liveA = quotes[symA];
      const liveB = quotes[symB];

      const avgA = Number(a.avgCost || a.avg || 0);
      const avgB = Number(b.avgCost || b.avg || 0);
      const qtyA = Number(a.qty || 0);
      const qtyB = Number(b.qty || 0);

      const ltpA = liveA ? liveA.price : Number(a.ltp || a.price || avgA);
      const ltpB = liveB ? liveB.price : Number(b.ltp || b.price || avgB);

      const curValA = ltpA * qtyA;
      const curValB = ltpB * qtyB;

      const pnlA = curValA - avgA * qtyA;
      const pnlB = curValB - avgB * qtyB;

      const netChgA = avgA > 0 ? (pnlA / (avgA * qtyA)) * 100 : 0;
      const netChgB = avgB > 0 ? (pnlB / (avgB * qtyB)) * 100 : 0;

      let valA, valB;
      switch (sortField) {
        case "instrument":
          valA = symA;
          valB = symB;
          return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case "qty":
          valA = qtyA;
          valB = qtyB;
          break;
        case "avgCost":
          valA = avgA;
          valB = avgB;
          break;
        case "ltp":
          valA = ltpA;
          valB = ltpB;
          break;
        case "curVal":
          valA = curValA;
          valB = curValB;
          break;
        case "pnl":
          valA = pnlA;
          valB = pnlB;
          break;
        case "netChg":
          valA = netChgA;
          valB = netChgB;
          break;
        default:
          valA = curValA;
          valB = curValB;
      }

      return sortDirection === "asc" ? valA - valB : valB - valA;
    });
  }, [holdings, searchTerm, sortField, sortDirection, quotes]);

  // Overall Totals
  const totalInvestment = processedHoldings.reduce(
    (acc, stock) => acc + (Number(stock.avgCost || stock.avg || 0) * Number(stock.qty || 0)),
    0
  );

  const totalCurrentVal = processedHoldings.reduce((acc, stock) => {
    const sym = (stock.instrument || stock.name || "").toUpperCase();
    const live = quotes[sym];
    const livePrice = live ? live.price : Number(stock.ltp || stock.price || stock.avgCost || 0);
    return acc + livePrice * Number(stock.qty || 0);
  }, 0);

  const totalPnl = totalCurrentVal - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100).toFixed(2) : "0.00";
  const isOverallProfit = totalPnl >= 0;

  // Day's P&L Calculation
  const { totalDayPnl, totalDayPnlPercent } = useMemo(() => {
    let dayPnlSum = 0;
    processedHoldings.forEach((stock) => {
      const sym = (stock.instrument || stock.name || "").toUpperCase();
      const live = quotes[sym];
      const qty = Number(stock.qty || 0);
      let dayChangePerShare = 0;

      if (live && live.change !== undefined) {
        dayChangePerShare = Number(live.change);
      } else if (stock.dayChg !== undefined) {
        const raw = typeof stock.dayChg === "string" ? parseFloat(stock.dayChg.replace(/,/g, "")) : Number(stock.dayChg);
        dayChangePerShare = isNaN(raw) ? 0 : raw;
      }
      dayPnlSum += (dayChangePerShare * qty);
    });

    const dayPct = totalCurrentVal > 0 ? ((dayPnlSum / (totalCurrentVal - dayPnlSum)) * 100).toFixed(2) : "0.00";
    return {
      totalDayPnl: dayPnlSum,
      totalDayPnlPercent: isNaN(Number(dayPct)) ? "0.00" : dayPct,
    };
  }, [processedHoldings, quotes, totalCurrentVal]);

  // Handlers for Row Quick Actions
  const handleQuickAdd = (e, symbol, ltp) => {
    e.stopPropagation();
    openBuyWindow(symbol, "BUY", ltp);
  };

  const handleQuickExit = (e, stock, ltp) => {
    e.stopPropagation();
    const sym = stock.instrument || stock.name;
    if (isCdslAuthorizedToday) {
      // Authorized already -> directly open sell window
      openBuyWindow(sym, "SELL", ltp);
    } else {
      // Prompt CDSL E-DIS authorization
      setHoldingForExit({ ...stock, instrument: sym, ltp });
      setIsCdslAuthModalOpen(true);
    }
  };

  const handleCdslAuthSuccess = () => {
    setIsCdslAuthorizedToday(true);
    sessionStorage.setItem("cdsl_authorized_today", "true");
    showToast(
      "CDSL E-DIS Authorized",
      "Demat holdings authorized for exit trading today until 3:30 PM.",
      "success"
    );
    if (holdingForExit) {
      const sym = holdingForExit.instrument || holdingForExit.name;
      openBuyWindow(sym, "SELL", holdingForExit.ltp);
    }
  };

  const handleStartFundSip = (fund) => {
    navigate("/orders", {
      state: {
        defaultSubTab: "sip",
        openSipModal: true,
        marketCode: fund.marketCode || "SIP_NIFTYBEES",
      },
    });
    showToast("Coin SIP Selected", `Configuring Demat SIP for "${fund.name}".`, "success");
  };

  return (
    <div className="holdings-page-container">
      {/* Depository Status Banner */}
      <AccountStatusBanner
        message="Account status: Holdings statement synced with CDSL Demat depository as of market close."
        linkText="View CDSL e-Voting"
        onLinkClick={() => setIsEvotingOpen(true)}
      />

      {/* Top Executive Portfolio Summary Card */}
      <div className="holdings-hero-summary-card">
        <div className="hero-summary-item">
          <span className="hero-summary-label">Total investment</span>
          <span className="hero-summary-val">
            ₹{totalInvestment.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="hero-summary-sub">Cost basis</span>
        </div>

        <div className="hero-summary-item">
          <span className="hero-summary-label">Current value</span>
          <span className="hero-summary-val">
            ₹{totalCurrentVal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="hero-summary-sub">Live evaluation</span>
        </div>

        <div className="hero-summary-item">
          <span className="hero-summary-label">Total P&L</span>
          <span className={`hero-summary-val ${isOverallProfit ? "text-up" : "text-down"}`}>
            {isOverallProfit ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className={`hero-pnl-pill ${isOverallProfit ? "pill-up" : "pill-down"}`}>
              {isOverallProfit ? "+" : ""}{totalPnlPercent}%
            </span>
          </span>
          <span className="hero-summary-sub">All-time return</span>
        </div>

        <div className="hero-summary-item no-border">
          <span className="hero-summary-label">Day's P&L</span>
          <span className={`hero-summary-val ${totalDayPnl >= 0 ? "text-up" : "text-down"}`}>
            {totalDayPnl >= 0 ? "+" : ""}₹{totalDayPnl.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className={`hero-pnl-pill ${totalDayPnl >= 0 ? "pill-up" : "pill-down"}`}>
              {totalDayPnl >= 0 ? "+" : ""}{totalDayPnlPercent}%
            </span>
          </span>
          <span className="hero-summary-sub">Today's tick change</span>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="holdings-top-bar">
        {/* Subtabs */}
        <div className="page-subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`subtab-btn ${activeTab === "equity" ? "active" : ""}`}
            onClick={() => setActiveTab("equity")}
          >
            Equity ({processedHoldings.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "mf" ? "active" : ""}`}
            onClick={() => setActiveTab("mf")}
          >
            Mutual funds ({userSips.length})
          </button>
        </div>

        {/* Right Action Utilities */}
        <div className="holdings-actions-right">
          <input
            type="text"
            placeholder="Search holdings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="holdings-search-input"
          />

          <button
            type="button"
            className="btn-export-trigger"
            onClick={() => setIsAnalyticsOpen(true)}
            title="Portfolio Analytics & Sector Breakdown"
          >
            Analytics &rsaquo;
          </button>

          {/* Export Statement Dropdown (CSV, Excel, PDF) */}
          <div className="export-dropdown-wrapper" ref={exportDropdownRef}>
            <button
              type="button"
              className="btn-export-trigger"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              title="Download Statement"
            >
              Download CSV &darr;
            </button>

            {isExportMenuOpen && (
              <div className="export-menu-popover">
                <div className="export-menu-header">Export Statement</div>
                <button
                  type="button"
                  className="export-option-btn"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportHoldingsToCSV(processedHoldings, currentUser, quotes);
                    showToast("Export Complete", "Holdings CSV downloaded successfully.", "success");
                  }}
                >
                  <span className="export-icon">📊</span>
                  <span>Download as CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  className="export-option-btn"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportHoldingsToExcel(processedHoldings, currentUser, quotes);
                    showToast("Export Complete", "Holdings Excel statement downloaded.", "success");
                  }}
                >
                  <span className="export-icon">📗</span>
                  <span>Download as Excel (.xls)</span>
                </button>
                <button
                  type="button"
                  className="export-option-btn"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportHoldingsToPDF(processedHoldings, currentUser, quotes);
                  }}
                >
                  <span className="export-icon">📄</span>
                  <span>Print / Save as PDF (.pdf)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center text-muted">
          Loading holdings from Demat depository ledger...
        </div>
      ) : activeTab === "mf" ? (
        /* Coin Direct Mutual Funds & Active SIP Portfolios */
        <div className="mf-showcase-container">
          {/* Top Coin Summary Strip */}
          <div className="mf-banner-header">
            <div>
              <h4>Zerodha Coin &bull; Demat Direct Mutual Funds & Active SIPs</h4>
              <p>Invest in zero-commission, Demat direct mutual funds with automated recurring schedules synced with CDSL Demat depository.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="coin-pill-tag">0% Commission</span>
              <button
                type="button"
                className="btn-kite-secondary"
                style={{ fontSize: "12px", padding: "6px 14px", background: "#ffffff", borderColor: "#86efac", color: "#166534", fontWeight: 600 }}
                onClick={() => navigate("/orders", { state: { defaultSubTab: "sip" } })}
              >
                Manage SIP Orders in Orders Tab ↗
              </button>
            </div>
          </div>

          {/* KPI Metrics Strip */}
          <div className="mf-kpi-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 600, letterSpacing: "0.5px" }}>Active Demat SIPs</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>{userSips.length} Mandates</div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "2px" }}>● Live in Execution Engine</div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 600, letterSpacing: "0.5px" }}>Total Capital Invested</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                ₹{totalSipInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Across {userSips.length} active schedules</div>
            </div>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 600, letterSpacing: "0.5px" }}>Demat Depository</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginTop: "8px" }}>
                CDSL ({currentUser?.demat || "1208160012345678"})
              </div>
              <div style={{ fontSize: "12px", color: "#2563eb", marginTop: "2px" }}>Holding verified in Demat</div>
            </div>
          </div>

          {/* SECTION 1: Active Demat SIP Portfolios */}
          {userSips.length > 0 && (
            <div className="active-sips-holdings-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                  My Active Demat SIP Portfolios ({userSips.length})
                </div>
                <button
                  type="button"
                  className="btn-kite-secondary"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                  onClick={() => navigate("/orders", { state: { defaultSubTab: "sip" } })}
                >
                  View in SIP Engine ↗
                </button>
              </div>

              <div className="kite-table-container">
                <table className="kite-data-table">
                  <thead>
                    <tr>
                      <th>SIP Strategy / Asset</th>
                      <th>Type</th>
                      <th>Frequency</th>
                      <th>Next Due Date</th>
                      <th>Invested Capital</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSips.map((sip) => {
                      const nextDate = sip.nextTriggerAt
                        ? new Date(sip.nextTriggerAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Next Market Cycle";
                      const invested = Number(sip.totalCapitalInvested || 0);

                      return (
                        <tr key={sip._id} className="holdings-table-row">
                          <td className="symbol-cell">
                            <span className="symbol-text" style={{ fontWeight: 600 }}>{sip.name}</span>
                            {sip.symbol && (
                              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                                ({sip.symbol})
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "11px", padding: "2px 8px", background: "#f1f5f9", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                              {sip.sipType || "STOCK"} SIP
                            </span>
                          </td>
                          <td>{sip.frequency}</td>
                          <td>{nextDate}</td>
                          <td style={{ fontWeight: 600 }}>
                            ₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span style={{ fontSize: "11px", padding: "3px 8px", background: "#dcfce7", color: "#15803d", borderRadius: "12px", fontWeight: 600 }}>
                              ● {sip.status || "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-kite-secondary"
                              style={{ fontSize: "11px", padding: "4px 10px" }}
                              onClick={() => navigate("/orders", { state: { defaultSubTab: "sip" } })}
                            >
                              Manage in Orders ↗
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

          {/* SECTION 2: Explore Direct Mutual Funds */}
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Explore 0% Commission Direct Mutual Funds & ETFs via Coin</span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>Direct Growth Plans</span>
            </div>

            <div className="mf-cards-grid">
              {CURATED_MUTUAL_FUNDS.map((fund) => (
                <div key={fund.code} className="mf-fund-card">
                  <div className="fund-top-row">
                    <div>
                      <div className="fund-name">{fund.name}</div>
                      <div
                        className="fund-category"
                        dangerouslySetInnerHTML={{ __html: fund.plan }}
                      />
                    </div>
                    <span className="fund-commission-badge">Direct Growth</span>
                  </div>

                  <div className="fund-stats-strip">
                    <div className="fund-stat-item">
                      <span className="stat-label">1Y Return</span>
                      <span className="stat-val cagr">{fund.cagr1Y}</span>
                    </div>
                    <div className="fund-stat-item">
                      <span className="stat-label">3Y Return</span>
                      <span className="stat-val cagr">{fund.cagr3Y}</span>
                    </div>
                    <div className="fund-stat-item">
                      <span className="stat-label">Latest NAV</span>
                      <span className="stat-val">{fund.nav}</span>
                    </div>
                    <div className="fund-stat-item">
                      <span className="stat-label">Min. SIP</span>
                      <span className="stat-val">{fund.minSip}</span>
                    </div>
                  </div>

                  <div className="fund-bottom-action">
                    <span className="fund-aum">AUM: {fund.aum}</span>
                    <button
                      type="button"
                      className="btn-start-sip-demat"
                      onClick={() => handleStartFundSip(fund)}
                    >
                      ⚡ Start Demat SIP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Equities Holdings Table */
        <>
          <div className="kite-table-container">
            <table className="kite-data-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => handleSort("instrument")}>
                    Instrument
                    <span className={`sort-arrow ${sortField === "instrument" ? "active" : "inactive"}`}>
                      {sortField === "instrument" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("qty")}>
                    Qty.
                    <span className={`sort-arrow ${sortField === "qty" ? "active" : "inactive"}`}>
                      {sortField === "qty" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("avgCost")}>
                    Avg. cost
                    <span className={`sort-arrow ${sortField === "avgCost" ? "active" : "inactive"}`}>
                      {sortField === "avgCost" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("ltp")}>
                    LTP
                    <span className={`sort-arrow ${sortField === "ltp" ? "active" : "inactive"}`}>
                      {sortField === "ltp" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("curVal")}>
                    Cur. val
                    <span className={`sort-arrow ${sortField === "curVal" ? "active" : "inactive"}`}>
                      {sortField === "curVal" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("pnl")}>
                    P&L
                    <span className={`sort-arrow ${sortField === "pnl" ? "active" : "inactive"}`}>
                      {sortField === "pnl" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort("netChg")}>
                    Net chg.
                    <span className={`sort-arrow ${sortField === "netChg" ? "active" : "inactive"}`}>
                      {sortField === "netChg" && sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  </th>
                  <th>Day chg.</th>
                </tr>
              </thead>
              <tbody>
                {processedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "48px 16px", color: "#666" }}>
                      <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "6px", color: "#444" }}>
                        No Demat holdings found
                      </div>
                      <div style={{ fontSize: "13px", color: "#888" }}>
                        You don't have any stocks in your Demat account ({currentUser?.demat || "CDSL"}) yet. Buy shares with product type <strong>CNC</strong> to hold them in Demat.
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedHoldings.map((stock, idx) => {
                  const symbol = stock.instrument || stock.name;
                  const avgCost = Number(stock.avgCost || stock.avg || 0);
                  const qty = Number(stock.qty || 0);
                  const live = quotes[symbol];
                  const ltp = live ? live.price : Number(stock.ltp || stock.price || avgCost);
                  const curVal = ltp * qty;
                  const pnl = curVal - avgCost * qty;
                  const isProfit = pnl >= 0;
                  const netChg =
                    avgCost > 0
                      ? (pnl >= 0 ? "+" : "") + (((ltp - avgCost) / avgCost) * 100).toFixed(2) + "%"
                      : stock.netChg || "0.00%";
                  const dayChg = live ? live.percent : (stock.dayChg || "0.00%");
                  const isDayProfit = !dayChg.startsWith("-");

                  let flashClass = "";
                  if (live?.tickDirection === "up") flashClass = "tick-flash-up";
                  else if (live?.tickDirection === "down") flashClass = "tick-flash-down";

                  return (
                    <tr key={stock._id || symbol || idx} className="holdings-table-row">
                      {/* Instrument with Hover Action Drawer */}
                      <td className="symbol-cell">
                        <div className="symbol-cell-wrapper">
                          <div className="symbol-title-group">
                            <span className="symbol-text">{symbol}</span>
                          </div>

                          {/* Hover Action Buttons */}
                          <div className="row-actions-drawer">
                            <button
                              type="button"
                              className="btn-row-action buy"
                              title="Buy More (Accumulate)"
                              onClick={(e) => handleQuickAdd(e, symbol, ltp)}
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              className="btn-row-action sell"
                              title="Exit Holding (CDSL Authorized)"
                              onClick={(e) => handleQuickExit(e, stock, ltp)}
                            >
                              Exit
                            </button>
                            <button
                              type="button"
                              className="btn-row-action depth"
                              title="View Market Depth"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDepthModal(symbol);
                              }}
                            >
                              Depth
                            </button>

                            {/* More Actions Popover */}
                            <div className="row-more-menu-container">
                              <button
                                type="button"
                                className="btn-row-action more"
                                title="More options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRowMenuSymbol((prev) => (prev === symbol ? null : symbol));
                                }}
                              >
                                &bull;&bull;&bull;
                              </button>

                              {openRowMenuSymbol === symbol && (
                                <div className="row-more-dropdown">
                                  <button
                                    type="button"
                                    className="row-dropdown-item"
                                    onClick={() => {
                                      setOpenRowMenuSymbol(null);
                                      openGttModal(symbol, ltp);
                                    }}
                                  >
                                    <span>🎯</span> Set Stoploss / GTT
                                  </button>
                                  <button
                                    type="button"
                                    className="row-dropdown-item"
                                    onClick={() => {
                                      setOpenRowMenuSymbol(null);
                                      navigate("/orders", { state: { defaultSubTab: "alerts" } });
                                    }}
                                  >
                                    <span>🔔</span> Set Price Alert
                                  </button>
                                  <button
                                    type="button"
                                    className="row-dropdown-item"
                                    onClick={() => {
                                      setOpenRowMenuSymbol(null);
                                      setBreakdownHolding(stock);
                                    }}
                                  >
                                    <span>📑</span> Holding Breakdown
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{qty}</td>
                      <td>{avgCost.toFixed(2)}</td>
                      <td className={flashClass}>{ltp.toFixed(2)}</td>
                      <td>
                        {curVal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {isProfit ? "+" : ""}
                        {pnl.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {netChg}
                      </td>
                      <td className={isDayProfit ? "text-up" : "text-down"}>
                        {dayChg}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <CdslAuthModal
        isOpen={isCdslAuthModalOpen}
        onClose={() => setIsCdslAuthModalOpen(false)}
        holding={holdingForExit}
        userDemat={currentUser?.demat}
        onAuthSuccess={handleCdslAuthSuccess}
      />

      <HoldingsAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        holdings={holdings}
        quotes={quotes}
      />

      <CdslEvotingModal
        isOpen={isEvotingOpen}
        onClose={() => setIsEvotingOpen(false)}
        userDemat={currentUser?.demat}
        showToast={showToast}
      />

      <HoldingsBreakdownModal
        isOpen={Boolean(breakdownHolding)}
        onClose={() => setBreakdownHolding(null)}
        holding={breakdownHolding}
        quote={breakdownHolding ? quotes[breakdownHolding.instrument || breakdownHolding.name] : null}
      />
    </div>
  );
};

export default Holdings;
