import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from "react";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import IpoApplyModal from "./overlays/IpoApplyModal";
import IpoModifyModal from "./overlays/IpoModifyModal";
import IpoAnalyticsDrawer from "./overlays/IpoAnalyticsDrawer";
import GSecBidModal from "./overlays/GSecBidModal";
import CorporateBuybackModal from "./overlays/CorporateBuybackModal";
import AuctionSellModal from "./overlays/AuctionSellModal";
import SseApplyModal from "./overlays/SseApplyModal";
import IpoFaqModal from "./overlays/IpoFaqModal";
import {
  exportBidsToCSV,
  exportBidsToExcel,
  exportBidsToPDF,
} from "../utils/BidsExportUtils";
import GeneralContext from "./GeneralContext";
import { ipoData as fallbackIpos } from "../data/mockData";
import "./BidsPage.css";

const API_BASE = "http://localhost:3002";

const BidsPage = () => {
  const [activeTab, setActiveTab] = useState("ipo");
  const [searchTerm, setSearchTerm] = useState("");
  const [ipos, setIpos] = useState([]);
  const [applications, setApplications] = useState([]);
  const [gsecs, setGsecs] = useState([]);
  const [userGsecBids, setUserGsecBids] = useState([]);
  const [corporateActions, setCorporateActions] = useState([]);
  const [userCorporateTenders, setUserCorporateTenders] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [userAuctionOffers, setUserAuctionOffers] = useState([]);
  const [sseIpos, setSseIpos] = useState([]);
  const [userSseApplications, setUserSseApplications] = useState([]);
  const [userHoldings, setUserHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers state
  const [activeIpoForApply, setActiveIpoForApply] = useState(null);
  const [activeIpoForModify, setActiveIpoForModify] = useState(null);
  const [activeIpoForAnalytics, setActiveIpoForAnalytics] = useState(null);
  const [activeAppDetails, setActiveAppDetails] = useState(null);
  const [activeGsecForBid, setActiveGsecForBid] = useState(null);
  const [activeCorpForTender, setActiveCorpForTender] = useState(null);
  const [activeAuctionForSell, setActiveAuctionForSell] = useState(null);
  const [activeSseForApply, setActiveSseForApply] = useState(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const { currentUser, showToast, refreshPortfolio } = useContext(GeneralContext);
  const activeUserId = currentUser?.userId;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fetch Master IPOs
  const fetchIpos = useCallback(() => {
    axios
      .get(`${API_BASE}/allIpos`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setIpos(res.data);
        } else {
          setIpos(fallbackIpos);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for IPOs, using fallback:", err.message);
        setIpos(fallbackIpos);
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch User's Submitted Applications
  const fetchMyApplications = useCallback(() => {
    if (!activeUserId) return;
    axios
      .get(`${API_BASE}/myIpoApplications`, { params: { userId: activeUserId } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setApplications(res.data);
        }
      })
      .catch(() => {});
  }, [activeUserId]);

  // 3. Fetch G-Secs, Corporate Actions, Auctions & SSE IPOs
  const fetchGsecsAndCorporate = useCallback(() => {
    axios
      .get(`${API_BASE}/allGsecs`)
      .then((res) => {
        if (Array.isArray(res.data)) setGsecs(res.data);
      })
      .catch(() => {});

    axios
      .get(`${API_BASE}/allCorporateActions`)
      .then((res) => {
        if (Array.isArray(res.data)) setCorporateActions(res.data);
      })
      .catch(() => {});

    axios
      .get(`${API_BASE}/allAuctions`)
      .then((res) => {
        if (Array.isArray(res.data)) setAuctions(res.data);
      })
      .catch(() => {});

    axios
      .get(`${API_BASE}/allSseIpos`)
      .then((res) => {
        if (Array.isArray(res.data)) setSseIpos(res.data);
      })
      .catch(() => {});

    if (activeUserId) {
      axios
        .get(`${API_BASE}/myGsecApplications`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) setUserGsecBids(res.data);
        })
        .catch(() => {});

      axios
        .get(`${API_BASE}/myCorporateActionTenders`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) setUserCorporateTenders(res.data);
        })
        .catch(() => {});

      axios
        .get(`${API_BASE}/myAuctionOffers`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) setUserAuctionOffers(res.data);
        })
        .catch(() => {});

      axios
        .get(`${API_BASE}/mySseApplications`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) setUserSseApplications(res.data);
        })
        .catch(() => {});

      axios
        .get(`${API_BASE}/allHoldings`, { params: { userId: activeUserId } })
        .then((res) => {
          if (Array.isArray(res.data)) setUserHoldings(res.data);
        })
        .catch(() => {});
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchIpos();
    fetchMyApplications();
    fetchGsecsAndCorporate();
  }, [fetchIpos, fetchMyApplications, fetchGsecsAndCorporate]);

  // Map user applications by symbol for instant lookup
  const applicationsBySymbol = useMemo(() => {
    const map = {};
    applications.forEach((app) => {
      if (!map[app.ipoSymbol] || app.status !== "CANCELLED") {
        map[app.ipoSymbol] = app;
      }
    });
    return map;
  }, [applications]);

  // Map user G-Sec bids by symbol
  const gsecBidsBySymbol = useMemo(() => {
    const map = {};
    userGsecBids.forEach((b) => {
      map[b.symbol] = b;
    });
    return map;
  }, [userGsecBids]);

  // Map user Corporate Action tenders by symbol
  const corporateTendersBySymbol = useMemo(() => {
    const map = {};
    userCorporateTenders.forEach((t) => {
      map[t.symbol] = t;
    });
    return map;
  }, [userCorporateTenders]);

  // Map user Auction offers by symbol
  const auctionOffersBySymbol = useMemo(() => {
    const map = {};
    userAuctionOffers.forEach((o) => {
      map[o.symbol] = o;
    });
    return map;
  }, [userAuctionOffers]);

  // Map user SSE applications by symbol
  const sseApplicationsBySymbol = useMemo(() => {
    const map = {};
    userSseApplications.forEach((s) => {
      map[s.symbol] = s;
    });
    return map;
  }, [userSseApplications]);

  // Live Heartbeat for Mandate synchronization
  useEffect(() => {
    const hasPendingMandate = applications.some(
      (a) => a.mandateStatus === "PENDING_APPROVAL" && a.status === "MANDATE_PENDING"
    );

    let pollInterval = null;
    if (hasPendingMandate) {
      pollInterval = setInterval(() => {
        axios
          .get(`${API_BASE}/myIpoApplications`, { params: { userId: activeUserId } })
          .then((res) => {
            if (Array.isArray(res.data)) {
              res.data.forEach((newApp) => {
                const prev = applications.find((a) => a._id === newApp._id);
                if (
                  prev &&
                  prev.mandateStatus === "PENDING_APPROVAL" &&
                  newApp.mandateStatus === "ACCEPTED"
                ) {
                  showToast(
                    "UPI Mandate Approved!",
                    `Your IPO bid for ${newApp.companyName} (${newApp.lots} Lot) has been authorized and accepted by the exchange!`,
                    "success"
                  );
                  refreshPortfolio();
                }
              });
              setApplications(res.data);
            }
          })
          .catch(() => {});
      }, 3500);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [applications, activeUserId, showToast, refreshPortfolio]);

  // Executive Top KPI Calculations
  const { activeBidsCount, totalLienBlocked, openIposCount, upcomingIposCount } = useMemo(() => {
    let lien = 0;
    let activeCount = 0;

    applications.forEach((a) => {
      if (a.status !== "CANCELLED") {
        activeCount++;
        lien += Number(a.totalAmount || 0);
      }
    });

    userGsecBids.forEach((b) => {
      if (b.status !== "CANCELLED") {
        activeCount++;
        lien += Number(b.totalAmount || 0);
      }
    });

    userSseApplications.forEach((s) => {
      if (s.status !== "CANCELLED") {
        activeCount++;
        lien += Number(s.totalAmount || 0);
      }
    });

    userAuctionOffers.forEach((o) => {
      if (o.status !== "CANCELLED") {
        activeCount++;
      }
    });

    let openCount = 0;
    let upcomingCount = 0;

    ipos.forEach((item) => {
      if (item.status === "Apply") openCount++;
      else if (item.status === "Pre-apply" || item.status === "Upcoming") upcomingCount++;
    });

    return {
      activeBidsCount: activeCount,
      totalLienBlocked: lien,
      openIposCount: openCount,
      upcomingIposCount: upcomingCount,
    };
  }, [applications, userGsecBids, userSseApplications, userAuctionOffers, ipos]);

  // Filtered & Sorted IPOs
  const filteredIpos = useMemo(() => {
    const list = ipos.filter(
      (ipo) =>
        ipo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getWeight = (item) => {
      const app = applicationsBySymbol[item.symbol];
      if (app && app.status !== "CANCELLED") return 0;
      if (item.status === "Apply") return 1;
      if (item.status === "Pre-apply") return 2;
      return 3;
    };

    return [...list].sort((a, b) => getWeight(a) - getWeight(b));
  }, [ipos, searchTerm, applicationsBySymbol]);

  // Cancel an active application
  const handleCancelApplication = async (appId, companyName) => {
    if (!window.confirm(`Are you sure you want to cancel your IPO application for "${companyName}"?`)) {
      return;
    }

    try {
      const res = await axios.delete(`${API_BASE}/cancelIpoApplication/${appId}`);
      if (res.data?.success) {
        showToast("Bid Cancelled", `Application for ${companyName} has been revoked. Bank lien released.`, "info");
        setActiveAppDetails(null);
        fetchMyApplications();
        refreshPortfolio();
      }
    } catch (err) {
      showToast("Cancellation Failed", err.response?.data?.message || err.message, "error");
    }
  };

  return (
    <div className="bids-page-container">
      {/* Depository Status Banner */}
      <AccountStatusBanner
        message="Account status: UPI mandate requests are processed between 10:00 AM and 5:00 PM on working days."
        linkText="IPO FAQs & help"
        onLinkClick={() => setIsFaqModalOpen(true)}
      />

      {/* Top Executive Bids KPI Hero Banner */}
      <div className="bids-hero-summary-card">
        <div className="bids-hero-item">
          <span className="bids-hero-label">Active Applications</span>
          <span className="bids-hero-val font-bold text-blue">
            {activeBidsCount} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>Live Bids</span>
          </span>
          <span className="bids-hero-sub">IPO & Primary Markets</span>
        </div>

        <div className="bids-hero-item">
          <span className="bids-hero-label">Blocked ASBA Lien</span>
          <span className="bids-hero-val font-bold text-green">
            ₹{totalLienBlocked.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="bids-hero-sub">Earning interest in savings a/c</span>
        </div>

        <div className="bids-hero-item">
          <span className="bids-hero-label">Open IPO Issues</span>
          <span className="bids-hero-val font-bold text-slate">
            {openIposCount} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>Live Bidding</span>
          </span>
          <span className="bids-hero-sub">Closes at 17:00 IST daily</span>
        </div>

        <div className="bids-hero-item no-border">
          <span className="bids-hero-label">Upcoming / Pre-Apply</span>
          <span className="bids-hero-val font-bold text-purple">
            {upcomingIposCount} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#64748b" }}>Pipeline</span>
          </span>
          <span className="bids-hero-sub">Advance bidding open</span>
        </div>
      </div>

      {/* Secondary Subtabs & Toolbar */}
      <div className="bids-top-bar">
        <div className="page-subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === "ipo" ? "active" : ""}`}
            onClick={() => setActiveTab("ipo")}
          >
            IPO ({ipos.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "gsec" ? "active" : ""}`}
            onClick={() => setActiveTab("gsec")}
          >
            Govt. securities ({gsecs.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "corp" ? "active" : ""}`}
            onClick={() => setActiveTab("corp")}
          >
            Corporate actions ({corporateActions.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "auctions" ? "active" : ""}`}
            onClick={() => setActiveTab("auctions")}
          >
            Auctions ({auctions.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === "sse" ? "active" : ""}`}
            onClick={() => setActiveTab("sse")}
          >
            SSE IPO ({sseIpos.length})
          </button>
        </div>

        {/* Search & Export Toolbar */}
        <div className="bids-actions-right">
          <input
            type="text"
            placeholder="Search company or symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bids-search-input"
          />

          <div className="bids-export-container" ref={exportDropdownRef}>
            <button
              type="button"
              className="btn-bids-export"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
            >
              Download Bids ▾
            </button>
            {isExportMenuOpen && (
              <div className="bids-export-popover">
                <div className="export-menu-header">Export Statement</div>
                <button
                  type="button"
                  className="bids-export-option"
                  onClick={() => {
                    exportBidsToCSV(filteredIpos, applications, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📊 CSV File (.csv)</span>
                </button>
                <button
                  type="button"
                  className="bids-export-option"
                  onClick={() => {
                    exportBidsToExcel(filteredIpos, applications, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📗 Excel Spreadsheet (.xls)</span>
                </button>
                <button
                  type="button"
                  className="bids-export-option"
                  onClick={() => {
                    exportBidsToPDF(filteredIpos, applications, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  <span>📄 Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bids-tab-content">
        {/* SUBTAB 1: IPO */}
        {activeTab === "ipo" && (
          <>
            {loading ? (
              <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Loading IPOs from primary market depository ledger...
              </div>
            ) : (
              <div className="kite-table-container">
                <table className="kite-data-table bids-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company Name</th>
                      <th>Date Range</th>
                      <th>Price Range</th>
                      <th>Min Amount (Qty)</th>
                      <th style={{ textAlign: "right" }}>Action & Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIpos.map((item) => {
                      const userApp = applicationsBySymbol[item.symbol];
                      const isPendingMandate = userApp && userApp.mandateStatus === "PENDING_APPROVAL" && userApp.status === "MANDATE_PENDING";
                      const isAccepted = userApp && userApp.mandateStatus === "ACCEPTED";

                      return (
                        <tr key={item.symbol} className="bids-row">
                          <td className="symbol-cell">
                            <div className="bids-symbol-wrapper">
                              <span className="symbol-name">{item.symbol}</span>
                              <button
                                type="button"
                                className="btn-mini-analytics"
                                onClick={() => setActiveIpoForAnalytics(item)}
                                title="View live GMP, subscription multiples, and issue details"
                              >
                                📊 GMP & Details
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="company-full-name">{item.name}</span>
                          </td>
                          <td>{item.dates}</td>
                          <td>{item.priceRange}</td>
                          <td>
                            {item.minAmount}{" "}
                            <span className="qty-pill">({item.minQty} shares)</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isPendingMandate ? (
                              <button
                                className="btn-mandate-pending"
                                onClick={() => setActiveAppDetails(userApp)}
                                title="Click to view application status or approve mandate"
                              >
                                ⏳ Mandate Pending
                              </button>
                            ) : isAccepted ? (
                              <button
                                className="btn-applied-success"
                                onClick={() => setActiveAppDetails(userApp)}
                                title="Click to inspect your verified ASBA bid or modify lots"
                              >
                                ✓ Applied ({userApp.lots} Lot)
                              </button>
                            ) : item.status === "Apply" ? (
                              <button
                                className="btn-apply-ipo"
                                onClick={() => setActiveIpoForApply(item)}
                              >
                                Apply
                              </button>
                            ) : item.status === "Pre-apply" ? (
                              <button
                                className="btn-preapply-ipo"
                                onClick={() => setActiveIpoForApply(item)}
                              >
                                Pre-apply
                              </button>
                            ) : (
                              <span className="status-closed">Closed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredIpos.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No IPOs found matching "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* SUBTAB 2: GOVT. SECURITIES (G-SEC & T-BILLS) */}
        {activeTab === "gsec" && (
          <div className="gsec-container">
            <div className="gsec-intro-card">
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>Reserve Bank of India (RBI) Non-Competitive Bidding</h4>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  Invest directly in Government of India Treasury Bills (T-Bills) and Dated Sovereign Securities with 100% sovereign credit guarantee.
                </p>
              </div>
              <span className="sovereign-tag">100% RBI Sovereign Guarantee</span>
            </div>

            <div className="kite-table-container">
              <table className="kite-data-table bids-table">
                <thead>
                  <tr>
                    <th>Security Name</th>
                    <th>Category</th>
                    <th>Indicative Yield</th>
                    <th>Bidding Window</th>
                    <th>Tenure / Maturity</th>
                    <th>Min Investment</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gsecs.map((item) => {
                    const userBid = gsecBidsBySymbol[item.symbol];

                    return (
                      <tr key={item.symbol}>
                        <td className="font-bold">{item.name}</td>
                        <td>
                          <span className="category-pill">{item.category}</span>
                        </td>
                        <td className="text-green font-bold">{item.yield}</td>
                        <td>{item.biddingRange}</td>
                        <td>{item.maturityDate}</td>
                        <td>{item.minAmount}</td>
                        <td style={{ textAlign: "right" }}>
                          {userBid ? (
                            <span className="bid-applied-pill">
                              ✓ Bidded ({userBid.units} units)
                            </span>
                          ) : (
                            <button
                              className="btn-apply-ipo"
                              onClick={() => setActiveGsecForBid(item)}
                            >
                              Bid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: CORPORATE ACTIONS (BUYBACKS & TENDERS) */}
        {activeTab === "corp" && (
          <div className="corp-container">
            <div className="gsec-intro-card" style={{ borderLeftColor: "#7c3aed" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>Demat Share Buybacks & Tender Offers</h4>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  Tender shares held in your Demat account for premium cash buybacks conducted through the exchange tender offer route.
                </p>
              </div>
              <span className="sovereign-tag" style={{ background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" }}>
                Zero Brokerage Tender
              </span>
            </div>

            <div className="kite-table-container">
              <table className="kite-data-table bids-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Action Type</th>
                    <th>Tender Price</th>
                    <th>Current Price</th>
                    <th>Buyback Premium</th>
                    <th>Tender Window</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {corporateActions.map((item) => {
                    const userTender = corporateTendersBySymbol[item.symbol];

                    return (
                      <tr key={item.symbol}>
                        <td className="font-bold">{item.companyName}</td>
                        <td>
                          <span className="category-pill" style={{ background: "#faf5ff", color: "#7e22ce" }}>{item.actionType}</span>
                        </td>
                        <td className="text-green font-bold">₹{item.tenderPrice.toFixed(2)}</td>
                        <td>₹{item.currentMarketPrice.toFixed(2)}</td>
                        <td className="text-blue font-bold">{item.premiumPercent}</td>
                        <td>{item.windowDates}</td>
                        <td style={{ textAlign: "right" }}>
                          {userTender ? (
                            <span className="bid-applied-pill" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                              ✓ Tendered ({userTender.tenderedQty} sh)
                            </span>
                          ) : (
                            <button
                              className="btn-apply-ipo"
                              style={{ background: "#7c3aed" }}
                              onClick={() => setActiveCorpForTender(item)}
                            >
                              Tender Shares
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: AUCTIONS (EXCHANGE SETTLEMENT AUCTIONS FOR SHORT DELIVERIES) */}
        {activeTab === "auctions" && (
          <div className="auction-container">
            <div className="gsec-intro-card" style={{ borderLeftColor: "#ea580c" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>Exchange Settlement Auction Desk (Physical Delivery Settlement)</h4>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  When short sellers fail to deliver shares on T+1 settlement, clearing corporations conduct exchange auctions. Holders of free Demat shares can offer them at an exchange-driven penalty premium (up to +20%).
                </p>
              </div>
              <div className="auction-time-indicator">
                <span className="live-pulse-dot"></span>
                <span>Auction Desk Active (14:00 - 14:45 IST)</span>
              </div>
            </div>

            <div className="kite-table-container">
              <table className="kite-data-table bids-table">
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Exchange</th>
                    <th>Shortage Demand</th>
                    <th>Settlement Base Price</th>
                    <th>Max Allowed Offer (+20% Cap)</th>
                    <th>Your Demat Free Balance</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions
                    .filter(
                      (item) =>
                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item) => {
                      const userOffer = auctionOffersBySymbol[item.symbol];
                      const holding = userHoldings.find(
                        (h) => (h.instrument || h.name || "").toUpperCase() === item.symbol.toUpperCase()
                      );
                      const dematQty = holding ? Number(holding.qty || 0) : 0;

                      return (
                        <tr key={item.symbol}>
                          <td>
                            <strong className="text-slate">{item.symbol}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{item.name}</div>
                          </td>
                          <td>
                            <span className="category-pill">{item.exchange}</span>
                          </td>
                          <td className="font-bold text-amber">{item.shortQtyRequired} shares</td>
                          <td className="font-bold">₹{item.basePrice.toFixed(2)}</td>
                          <td className="font-bold text-green">₹{item.maxAllowedPrice.toFixed(2)}</td>
                          <td>
                            <span className={`holding-check-pill ${dematQty > 0 ? "has-shares" : "no-shares"}`}>
                              {dematQty > 0 ? `✓ ${dematQty} shares` : "0 shares"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {userOffer ? (
                              <span className="bid-applied-pill" style={{ background: "#fff7ed", color: "#ea580c", borderColor: "#fed7aa" }}>
                                ✓ Offered ({userOffer.quantity} sh @ ₹{userOffer.offerPrice.toFixed(2)})
                              </span>
                            ) : (
                              <button
                                className="btn-auction-sell"
                                onClick={() => setActiveAuctionForSell(item)}
                                disabled={dematQty === 0}
                                title={dematQty === 0 ? "Requires free shares in Demat account" : "Place offer in auction"}
                              >
                                {dematQty > 0 ? "Sell in Auction" : "No Free Shares"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* My Active Auction Offers Table */}
            {userAuctionOffers.length > 0 && (
              <div className="auction-offers-section">
                <h4 className="section-subheading">My Submitted Auction Offers ({userAuctionOffers.length})</h4>
                <table className="kite-data-table bids-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Symbol</th>
                      <th>Offered Qty</th>
                      <th>Offer Price</th>
                      <th>Premium %</th>
                      <th>Expected Proceeds</th>
                      <th>Status</th>
                      <th>Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAuctionOffers.map((o) => (
                      <tr key={o.orderId || o._id}>
                        <td style={{ fontFamily: "monospace", fontSize: "11.5px" }}>{o.orderId}</td>
                        <td className="font-bold">{o.symbol}</td>
                        <td>{o.quantity} shares</td>
                        <td className="font-bold">₹{o.offerPrice.toFixed(2)}</td>
                        <td className="text-green font-bold">{o.premiumPercent}</td>
                        <td className="font-bold">₹{Number(o.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className="bid-applied-pill" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "#64748b" }}>{o.settlementDate || "T+1"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: SSE IPO (SOCIAL STOCK EXCHANGE) */}
        {activeTab === "sse" && (
          <div className="sse-container">
            <div className="gsec-intro-card" style={{ borderLeftColor: "#2563eb" }}>
              <div>
                <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>SEBI Social Stock Exchange (SSE) Desk</h4>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                  Invest in Zero Coupon Zero Principal (ZCZP) instruments issued by registered Non-Profit Organizations (NPOs). Contributions are 100% tax deductible under Section 80G with audited social impact outcomes.
                </p>
              </div>
              <span className="sovereign-tag" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                100% Tax Exempt u/s 80G
              </span>
            </div>

            <div className="kite-table-container">
              <table className="kite-data-table bids-table">
                <thead>
                  <tr>
                    <th>Organization / Issuer</th>
                    <th>Development Focus Area</th>
                    <th>Bidding Window</th>
                    <th>Min Contribution</th>
                    <th>Target Fundraise</th>
                    <th>Tax Exemption</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sseIpos
                    .filter(
                      (item) =>
                        item.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.focusArea.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item) => {
                      const userSse = sseApplicationsBySymbol[item.symbol];

                      return (
                        <tr key={item.symbol}>
                          <td>
                            <strong className="text-slate">{item.orgName}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {item.symbol} • SEBI Reg: {item.sebiRegNo}
                            </div>
                          </td>
                          <td>
                            <span className="category-pill" style={{ background: "#f0fdf4", color: "#166534" }}>
                              {item.focusArea}
                            </span>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", maxWidth: "260px" }}>
                              {item.impactGoal}
                            </div>
                          </td>
                          <td>{item.issueDates}</td>
                          <td>
                            <strong>₹{item.minInvestment.toLocaleString("en-IN")}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>({item.minUnits} units @ ₹{item.unitPrice})</div>
                          </td>
                          <td className="font-bold text-blue">{item.targetAmount}</td>
                          <td>
                            <span className="bid-applied-pill" style={{ fontSize: "10px", padding: "2px 6px" }}>
                              {item.taxExemption}
                            </span>
                            <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                              Auditor: {item.socialAuditor}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {userSse ? (
                              <span className="bid-applied-pill" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                ✓ Contributed (₹{Number(userSse.totalAmount || 0).toLocaleString("en-IN")})
                              </span>
                            ) : (
                              <button
                                className="btn-apply-ipo"
                                style={{ background: "#2563eb" }}
                                onClick={() => setActiveSseForApply(item)}
                              >
                                Apply / Donate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* My Active SSE Applications & 80G Certificates */}
            {userSseApplications.length > 0 && (
              <div className="auction-offers-section">
                <h4 className="section-subheading">My SSE ZCZP Contributions & Tax Certificates ({userSseApplications.length})</h4>
                <table className="kite-data-table bids-table">
                  <thead>
                    <tr>
                      <th>ASBA Ref</th>
                      <th>Organization</th>
                      <th>Units</th>
                      <th>Pledged Capital</th>
                      <th>PAN (Form 10BE)</th>
                      <th>80G Certificate No</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSseApplications.map((s) => (
                      <tr key={s.asbaReference || s._id}>
                        <td style={{ fontFamily: "monospace", fontSize: "11.5px" }}>{s.asbaReference}</td>
                        <td className="font-bold">{s.orgName}</td>
                        <td>{s.units} units</td>
                        <td className="font-bold text-blue">₹{Number(s.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontFamily: "monospace" }}>{s.panNumber}</td>
                        <td>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#166534", background: "#f0fdf4", padding: "2px 6px", borderRadius: "3px" }}>
                            {s.taxCertificateNo}
                          </span>
                        </td>
                        <td>
                          <span className="bid-applied-pill">
                            {s.status} (ASBA Lien)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Modal to Apply for IPO */}
      {activeIpoForApply && (
        <IpoApplyModal
          ipo={activeIpoForApply}
          onClose={() => setActiveIpoForApply(null)}
          onAppliedSuccess={() => {
            fetchMyApplications();
          }}
        />
      )}

      {/* 2. Modal to Modify Existing IPO Bid */}
      {activeIpoForModify && (
        <IpoModifyModal
          application={activeIpoForModify}
          onClose={() => setActiveIpoForModify(null)}
          onModifiedSuccess={() => {
            fetchMyApplications();
            setActiveAppDetails(null);
          }}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {/* 3. Modal / Drawer to View Applied Bid Details */}
      {activeAppDetails && (
        <div className="ipo-modal-overlay" onClick={() => setActiveAppDetails(null)}>
          <div className="ipo-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="ipo-modal-header">
              <div className="ipo-header-main">
                <div className="ipo-symbol-tag">{activeAppDetails.ipoSymbol}</div>
                <div>
                  <h3 className="ipo-company-title">{activeAppDetails.companyName}</h3>
                  <div className="ipo-header-meta">
                    <span>App #{activeAppDetails.applicationNumber}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveAppDetails(null)}>
                &times;
              </button>
            </div>

            <div className="ipo-modal-body" style={{ gap: "14px" }}>
              <div
                className="meta-box"
                style={{
                  background: activeAppDetails.mandateStatus === "ACCEPTED" ? "#ecfdf5" : "#fef3c7",
                  borderColor: activeAppDetails.mandateStatus === "ACCEPTED" ? "#a7f3d0" : "#fde68a",
                }}
              >
                <span className="meta-label" style={{ color: activeAppDetails.mandateStatus === "ACCEPTED" ? "#047857" : "#b45309" }}>
                  ASBA MANDATE STATUS
                </span>
                <span className="meta-val" style={{ color: activeAppDetails.mandateStatus === "ACCEPTED" ? "#065f46" : "#92400e", fontSize: "14px" }}>
                  {activeAppDetails.mandateStatus === "ACCEPTED" ? "✓ Approved & Bank Lien Marked Active" : "⏳ Pending Approval in Email / UPI App"}
                </span>
              </div>

              {/* Status Stepper */}
              <div className="app-status-stepper">
                <div className="stepper-node active">
                  <div className="node-dot">1</div>
                  <span className="node-text">Bid Placed</span>
                </div>
                <div className={`stepper-node ${activeAppDetails.mandateStatus === "ACCEPTED" ? "active" : ""}`}>
                  <div className="node-dot">2</div>
                  <span className="node-text">Lien Marked</span>
                </div>
                <div className="stepper-node">
                  <div className="node-dot">3</div>
                  <span className="node-text">Allotment</span>
                </div>
                <div className="stepper-node">
                  <div className="node-dot">4</div>
                  <span className="node-text">Listing</span>
                </div>
              </div>

              <div className="summary-fields-grid">
                <div className="field-block">
                  <span className="field-lbl">Category</span>
                  <span className="field-v">{activeAppDetails.investorCategory}</span>
                </div>
                <div className="field-block">
                  <span className="field-lbl">Applied Lots</span>
                  <span className="field-v">{activeAppDetails.lots} Lot ({activeAppDetails.totalQty} Shares)</span>
                </div>
                <div className="field-block">
                  <span className="field-lbl">Bid Price</span>
                  <span className="field-v">₹{Number(activeAppDetails.bidPrice).toFixed(2)} {activeAppDetails.isCutOff ? "(Cut-off)" : ""}</span>
                </div>
                <div className="field-block">
                  <span className="field-lbl">Total Blocked Lien</span>
                  <span className="field-v text-green font-bold">₹{Number(activeAppDetails.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="field-block">
                  <span className="field-lbl">UPI ID</span>
                  <span className="field-v">{activeAppDetails.upiId}</span>
                </div>
                <div className="field-block">
                  <span className="field-lbl">Demat BO ID</span>
                  <span className="field-v">{activeAppDetails.dematBoId}</span>
                </div>
              </div>
            </div>

            <div className="ipo-modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn-cancel-bid"
                onClick={() => handleCancelApplication(activeAppDetails._id, activeAppDetails.companyName)}
              >
                Cancel / Revoke Bid
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-kite-secondary"
                  onClick={() => {
                    setActiveIpoForModify(activeAppDetails);
                  }}
                >
                  ✏️ Modify Bid
                </button>
                <button
                  type="button"
                  className="btn-kite-primary"
                  onClick={() => setActiveAppDetails(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. IPO Analytics & GMP Drawer */}
      {activeIpoForAnalytics && (
        <IpoAnalyticsDrawer
          isOpen={!!activeIpoForAnalytics}
          onClose={() => setActiveIpoForAnalytics(null)}
          ipo={activeIpoForAnalytics}
          onApplyClick={(ipoItem) => setActiveIpoForApply(ipoItem)}
        />
      )}

      {/* 5. G-Sec Non-Competitive Bidding Modal */}
      {activeGsecForBid && (
        <GSecBidModal
          gsec={activeGsecForBid}
          onClose={() => setActiveGsecForBid(null)}
          onBidSuccess={() => fetchGsecsAndCorporate()}
          currentUser={currentUser}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {/* 6. Corporate Action / Share Buyback Modal */}
      {activeCorpForTender && (
        <CorporateBuybackModal
          action={activeCorpForTender}
          onClose={() => setActiveCorpForTender(null)}
          onTenderSuccess={() => fetchGsecsAndCorporate()}
          currentUser={currentUser}
          holdings={userHoldings}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {/* 7. Auction Sell Order Modal */}
      {activeAuctionForSell && (
        <AuctionSellModal
          auction={activeAuctionForSell}
          onClose={() => setActiveAuctionForSell(null)}
          onOfferSuccess={() => fetchGsecsAndCorporate()}
          currentUser={currentUser}
          holdings={userHoldings}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {/* 8. Social Stock Exchange (SSE) Apply Modal */}
      {activeSseForApply && (
        <SseApplyModal
          sseIpo={activeSseForApply}
          onClose={() => setActiveSseForApply(null)}
          onApplySuccess={() => fetchGsecsAndCorporate()}
          currentUser={currentUser}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {/* 9. IPO FAQs & Help Knowledge Base Modal */}
      <IpoFaqModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
      />
    </div>
  );
};

export default BidsPage;
