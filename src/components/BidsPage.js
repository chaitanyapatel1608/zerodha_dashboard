import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import IpoApplyModal from "./overlays/IpoApplyModal";
import GeneralContext from "./GeneralContext";
import { ipoData as fallbackIpos } from "../data/mockData";

const API_BASE = "http://localhost:3002";

const BidsPage = () => {
  const [activeTab, setActiveTab] = useState("ipo");
  const [searchTerm, setSearchTerm] = useState("");
  const [ipos, setIpos] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeIpoForApply, setActiveIpoForApply] = useState(null);
  const [activeAppDetails, setActiveAppDetails] = useState(null);

  const { currentUser, showToast, refreshPortfolio } = useContext(GeneralContext);
  const activeUserId = currentUser?.userId || "ZU9344";

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
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for IPOs, using fallback:", err.message);
        setIpos(fallbackIpos);
        setLoading(false);
      });
  }, []);

  // 2. Fetch User's Submitted Applications
  const fetchMyApplications = useCallback(() => {
    axios
      .get(`${API_BASE}/myIpoApplications`, { params: { userId: activeUserId } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setApplications(res.data);
        }
      })
      .catch((err) => {
        console.warn("Unable to fetch user applications:", err.message);
      });
  }, [activeUserId]);

  useEffect(() => {
    fetchIpos();
    fetchMyApplications();
  }, [fetchIpos, fetchMyApplications]);

  // Map user applications by symbol for instant lookup
  const applicationsBySymbol = useMemo(() => {
    const map = {};
    applications.forEach((app) => {
      // Prioritize active/pending over cancelled
      if (!map[app.ipoSymbol] || app.status !== "CANCELLED") {
        map[app.ipoSymbol] = app;
      }
    });
    return map;
  }, [applications]);

  // Live Heartbeat for Option C (Email Mandate synchronization)
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
              // Check if any previously pending application was just accepted
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

  const filteredIpos = useMemo(() => {
    const list = ipos.filter(
      (ipo) =>
        ipo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Intelligent sort:
    // 0: Applied / Active bids first
    // 1: Live open issues (Apply)
    // 2: Upcoming pre-market issues (Pre-apply)
    // 3: Closed / listed issues
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
      <AccountStatusBanner
        message="Account status: UPI mandate requests are processed between 10:00 AM and 5:00 PM on working days."
        linkText="IPO FAQs & help"
      />

      {/* Secondary Tabs */}
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
          Govt. securities
        </button>
        <button
          className={`subtab-btn ${activeTab === "auctions" ? "active" : ""}`}
          onClick={() => setActiveTab("auctions")}
        >
          Auctions
        </button>
        <button
          className={`subtab-btn ${activeTab === "corp" ? "active" : ""}`}
          onClick={() => setActiveTab("corp")}
        >
          Corporate actions
        </button>
        <button
          className={`subtab-btn ${activeTab === "sse" ? "active" : ""}`}
          onClick={() => setActiveTab("sse")}
        >
          SSE IPO
        </button>
      </div>

      <div className="bids-tab-content">
        {activeTab === "ipo" && (
          <>
            <div className="bids-filter-bar">
              <span className="bids-count-title">
                Initial Public Offerings ({filteredIpos.length})
              </span>
              <input
                type="text"
                placeholder="Search company or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bids-search-input"
              />
            </div>

            {loading ? (
              <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Loading IPOs from database...
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIpos.map((item) => {
                      const userApp = applicationsBySymbol[item.symbol];
                      const isPendingMandate = userApp && userApp.mandateStatus === "PENDING_APPROVAL" && userApp.status === "MANDATE_PENDING";
                      const isAccepted = userApp && userApp.mandateStatus === "ACCEPTED";

                      return (
                        <tr key={item.symbol}>
                          <td className="symbol-cell">{item.symbol}</td>
                          <td>
                            <span className="company-full-name">{item.name}</span>
                          </td>
                          <td>{item.dates}</td>
                          <td>{item.priceRange}</td>
                          <td>
                            {item.minAmount}{" "}
                            <span className="qty-pill">({item.minQty} shares)</span>
                          </td>
                          <td>
                            {/* Dynamic State Rendering */}
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
                                title="Click to inspect your verified ASBA bid"
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

        {activeTab === "gsec" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h4 className="empty-state-title">No Active Government Security Non-Competitive Bids</h4>
            <p className="empty-state-subtitle">
              Treasury bills (T-Bills) and Government of India Dated Bonds will appear here during RBI auction windows.
            </p>
          </div>
        )}

        {activeTab === "auctions" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>
            <h4 className="empty-state-title">No Pending Auctions</h4>
            <p className="empty-state-subtitle">
              Exchange settlement auctions for short deliveries will appear here when applicable.
            </p>
          </div>
        )}

        {activeTab === "corp" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <h4 className="empty-state-title">Corporate Actions</h4>
            <p className="empty-state-subtitle">
              Buybacks, takeover offers, and de-listing tenders will be displayed here for participating stocks.
            </p>
          </div>
        )}

        {activeTab === "sse" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <h4 className="empty-state-title">Social Stock Exchange (SSE)</h4>
            <p className="empty-state-subtitle">
              Zero Coupon Zero Principal instruments issued by Not-for-Profit Organizations registered on NSE SSE.
            </p>
          </div>
        )}
      </div>

      {/* 1. Modal to Apply for IPO */}
      {activeIpoForApply && (
        <IpoApplyModal
          ipo={activeIpoForApply}
          onClose={() => setActiveIpoForApply(null)}
          onAppliedSuccess={(newApp) => {
            fetchMyApplications();
          }}
        />
      )}

      {/* 2. Modal / Drawer to View Applied Bid Details */}
      {activeAppDetails && (
        <div className="ipo-modal-overlay" onClick={() => setActiveAppDetails(null)}>
          <div className="ipo-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
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
              <div className="meta-box" style={{ background: activeAppDetails.mandateStatus === "ACCEPTED" ? "#ecfdf5" : "#fef3c7", borderColor: activeAppDetails.mandateStatus === "ACCEPTED" ? "#a7f3d0" : "#fde68a" }}>
                <span className="meta-label" style={{ color: activeAppDetails.mandateStatus === "ACCEPTED" ? "#047857" : "#b45309" }}>
                  MANDATE STATUS
                </span>
                <span className="meta-val" style={{ color: activeAppDetails.mandateStatus === "ACCEPTED" ? "#065f46" : "#92400e", fontSize: "14px" }}>
                  {activeAppDetails.mandateStatus === "ACCEPTED" ? "✓ Approved & Lien Marked Active" : "⏳ Pending Approval in Email"}
                </span>
              </div>

              {activeAppDetails.mandateStatus === "PENDING_APPROVAL" && (
                <div className="email-mandate-alert">
                  <div className="mail-icon">✉️</div>
                  <div className="mail-text">
                    An authorization email was sent to <strong>{activeAppDetails.userEmail}</strong>.
                    Open your email and click <strong>[Approve UPI Mandate]</strong> to complete your bid.
                  </div>
                </div>
              )}

              <div className="ipo-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">INVESTOR CATEGORY</span>
                  <span className="meta-val">{activeAppDetails.investorCategory === "HNI" ? "HNI" : "Individual (Retail)"}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">LOTS & SHARES</span>
                  <span className="meta-val">{activeAppDetails.lots} Lot ({activeAppDetails.totalQty} Shares)</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">BID PRICE</span>
                  <span className="meta-val">₹{Number(activeAppDetails.bidPrice).toFixed(2)}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">TOTAL ASBA AMOUNT</span>
                  <span className="meta-val">₹{Number(activeAppDetails.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">UPI ID</span>
                  <span className="meta-val">{activeAppDetails.upiId}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">CDSL BO ID</span>
                  <span className="meta-val">{activeAppDetails.dematBoId}</span>
                </div>
              </div>

              <div className="ipo-modal-footer" style={{ marginTop: "10px", justifyContent: "space-between" }}>
                <button
                  type="button"
                  style={{ background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                  onClick={() => handleCancelApplication(activeAppDetails._id, activeAppDetails.companyName)}
                >
                  Cancel IPO Bid
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveAppDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidsPage;
