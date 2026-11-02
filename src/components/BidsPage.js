import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import { ipoData as fallbackIpos } from "../data/mockData";

const BidsPage = () => {
  const [activeTab, setActiveTab] = useState("ipo");
  const [searchTerm, setSearchTerm] = useState("");
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3002/allIpos")
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

  const filteredIpos = useMemo(() => {
    return ipos.filter(
      (ipo) =>
        ipo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ipos, searchTerm]);

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
              <div className="p-4 text-center text-muted">Loading IPOs from database...</div>
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
                    {filteredIpos.map((item) => (
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
                          {item.status === "Apply" ? (
                            <button
                              className="btn-apply-ipo"
                              onClick={() => alert(`Applying for ${item.name} with UPI Mandate...`)}
                            >
                              Apply
                            </button>
                          ) : item.status === "Pre-apply" ? (
                            <button
                              className="btn-preapply-ipo"
                              onClick={() => alert(`Pre-applying for ${item.name}...`)}
                            >
                              Pre-apply
                            </button>
                          ) : (
                            <span className="status-closed">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
            <h4 className="empty-state-title">No Auction Sessions Available</h4>
            <p className="empty-state-subtitle">
              Exchange auction sessions take place between 2:00 PM and 2:45 PM for shortage settlement.
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
            <h4 className="empty-state-title">No Corporate Actions Orders</h4>
            <p className="empty-state-subtitle">
              Eligible Buybacks, Takeovers, and Delisting offers will appear here.
            </p>
          </div>
        )}

        {activeTab === "sse" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
              </svg>
            </div>
            <h4 className="empty-state-title">No Social Stock Exchange Issues Open</h4>
            <p className="empty-state-subtitle">
              Zero Coupon Zero Principal instruments issued by non-profit organizations will be displayed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidsPage;
