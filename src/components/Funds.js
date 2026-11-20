import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GeneralContext from "./GeneralContext";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import AddFundsModal from "./overlays/AddFundsModal";
import WithdrawFundsModal from "./overlays/WithdrawFundsModal";
import CollateralPledgeModal from "./overlays/CollateralPledgeModal";
import AddBankAccountModal from "./overlays/AddBankAccountModal";
import FundPoliciesModal from "./overlays/FundPoliciesModal";
import {
  exportFundsToCSV,
  exportFundsToExcel,
  exportFundsToPDF,
} from "../utils/FundsExportUtils";
import { accountBalances as fallbackBalances } from "../data/mockData";
import "./Funds.css";

import { API_BASE, AUTH_PORTAL_URL } from "../config/api";

const Funds = () => {
  const navigate = useNavigate();
  const { portfolioTrigger, currentUser, showToast, refreshPortfolio } = useContext(GeneralContext);
  const activeUserId = currentUser?.userId;

  const [funds, setFunds] = useState(fallbackBalances);
  async function managePendingDeposit(id, action) {
    try {
      const { data } = await axios.post(API_BASE + "/fundDeposit/" + id + "/" + action);
      showToast("Demo deposit", data.message, data.delivered === false ? "warning" : "info");
      refreshPortfolio();
    } catch (err) {
      showToast("Demo deposit", err.response?.data?.message || "Request failed.", "error");
    }
  }

  const [transactions, setTransactions] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState("ALL"); // ALL | PAYIN | PAYOUT | PLEDGE

  // Modals state
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isPledgeOpen, setIsPledgeOpen] = useState(false);
  const [isFundPoliciesOpen, setIsFundPoliciesOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportDropdownRef = useRef(null);

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

  // Fetch all funds and treasury data
  const fetchFundsData = useCallback(() => {
    if (!activeUserId) return;

    // 1. User Funds Balance
    axios
      .get(`${API_BASE}/userFunds`, { params: { userId: activeUserId } })
      .then((res) => {
        if (res.data && res.data.equity) {
          setFunds(res.data);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for funds, using fallback:", err.message);
      });

    // 2. Transaction Ledger
    axios
      .get(`${API_BASE}/fundsTransactions`, { params: { userId: activeUserId } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTransactions(res.data);
        }
      })
      .catch(() => {});

    // 3. Pledged Collateral
    axios
      .get(`${API_BASE}/myPledgedHoldings`, { params: { userId: activeUserId } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPledges(res.data);
        }
      })
      .catch(() => {});

    // 4. Demat Holdings for Pledging
    axios
      .get(`${API_BASE}/allHoldings`, { params: { userId: activeUserId } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setHoldings(res.data);
        }
      })
      .catch(() => {});
  }, [activeUserId]);

  useEffect(() => {
    fetchFundsData();
  }, [fetchFundsData, portfolioTrigger]);

  // Live polling heartbeat when there's an active pending deposit
  useEffect(() => {
    const hasPendingDeposit = transactions.some((t) => t.status === "PENDING_APPROVAL");
    let interval = null;

    if (hasPendingDeposit) {
      interval = setInterval(() => {
        axios
          .get(`${API_BASE}/fundsTransactions`, { params: { userId: activeUserId } })
          .then((res) => {
            if (Array.isArray(res.data)) {
              res.data.forEach((newTx) => {
                const prev = transactions.find((t) => t._id === newTx._id);
                if (prev && prev.status === "PENDING_APPROVAL" && newTx.status === "COMPLETED") {
                  showToast(
                    "Payment Approved!",
                    `₹${newTx.amount.toLocaleString("en-IN")} credited to your trading margin!`,
                    "success"
                  );
                  fetchFundsData();
                  if (refreshPortfolio) refreshPortfolio();
                }
              });
              setTransactions(res.data);
            }
          })
          .catch(() => {});
      }, 3500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [transactions, activeUserId, fetchFundsData, showToast, refreshPortfolio]);

  const equity = funds.equity || fallbackBalances.equity;

  // Executive Top KPI Calculations
  const {
    availableMarginNum,
    usedMarginNum,
    availableCashNum,
    totalCollateralNum,
    totalCapital,
    utilizationPercent,
  } = useMemo(() => {
    const avail = parseFloat((equity.availableMargin || "0").replace(/,/g, "")) || 0;
    const used = parseFloat((equity.usedMargin || "0").replace(/,/g, "")) || 0;
    const cash = parseFloat((equity.availableCash || "0").replace(/,/g, "")) || 0;
    const collateral = parseFloat((equity.totalCollateral || "0").replace(/,/g, "")) || 0;
    const cap = avail + used;
    const util = cap > 0 ? (used / cap) * 100 : 0;

    return {
      availableMarginNum: avail,
      usedMarginNum: used,
      availableCashNum: cash,
      totalCollateralNum: collateral,
      totalCapital: cap,
      utilizationPercent: util,
    };
  }, [equity]);

  // Filtered transactions for ledger
  const filteredTransactions = useMemo(() => {
    if (ledgerFilter === "PAYIN") return transactions.filter((t) => t.type === "PAYIN");
    if (ledgerFilter === "PAYOUT") return transactions.filter((t) => t.type === "PAYOUT");
    if (ledgerFilter === "PLEDGE")
      return transactions.filter((t) => t.type === "PLEDGE_MARGIN" || t.type === "UNPLEDGE_MARGIN");
    return transactions;
  }, [transactions, ledgerFilter]);

  return (
    <div className="funds-page-container">
      <AccountStatusBanner
        message="Account status: Funds added via instant UPI or Netbanking are credited immediately for equity & F&O trading."
        linkText="View fund policies"
        onLinkClick={() => setIsFundPoliciesOpen(true)}
      />

      {/* Mobile-Only Account Subtabs Switcher */}
      <div className="mobile-account-subtabs-bar" role="tablist" aria-label="Mobile Account Navigation">
        <button
          type="button"
          className="account-subtab-pill"
          onClick={() => navigate("/account")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "5px" }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile & Settings</span>
        </button>
        <button
          type="button"
          className="account-subtab-pill active"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "5px" }}>
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Funds & Margins</span>
        </button>
      </div>

      {/* 1. Executive Top Liquidity & Margin Utilization Banner */}
      <div className="funds-hero-banner">
        <div className="funds-hero-card">
          <span className="funds-hero-label">Total Equity Capital</span>
          <span className="funds-hero-val font-bold">
            ₹{totalCapital.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="funds-hero-sub">Cash + Pledged Collateral</span>
        </div>

        <div className="funds-hero-card">
          <span className="funds-hero-label">Available Trading Margin</span>
          <span className="funds-hero-val font-bold text-brand-blue">
            ₹{availableMarginNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="funds-hero-sub">Usable for MIS & F&O orders</span>
        </div>

        <div className="funds-hero-card">
          <span className="funds-hero-label">Margin Utilization</span>
          <span className="funds-hero-val font-bold" style={{ color: utilizationPercent > 80 ? "#dc2626" : "#0f172a" }}>
            {utilizationPercent.toFixed(1)}%{" "}
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
              (₹{usedMarginNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
            </span>
          </span>
          <div className="utilization-meter-wrap">
            <div
              className="utilization-meter-fill"
              style={{
                width: `${Math.min(100, Math.max(4, utilizationPercent))}%`,
                backgroundColor:
                  utilizationPercent > 80 ? "#dc2626" : utilizationPercent > 50 ? "#ea580c" : "#16a34a",
              }}
            ></div>
          </div>
        </div>

        <div className="funds-hero-card">
          <span className="funds-hero-label">Pledged Collateral</span>
          <span className="funds-hero-val font-bold text-purple">
            ₹{totalCollateralNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="funds-hero-sub">
            {pledges.length} Active {pledges.length === 1 ? "Stock Lien" : "Stock Liens"}
          </span>
        </div>
      </div>

      {/* 2. Top Action Bar */}
      <div className="funds-action-bar">
        <span className="funds-subtext">
          Instant, zero-cost fund transfers with UPI
        </span>
        <div className="funds-buttons-group">
          <button
            type="button"
            className="funds-action-btn funds-btn-add"
            onClick={() => setIsAddFundsOpen(true)}
          >
            + Add funds
          </button>
          <button
            type="button"
            className="funds-action-btn funds-btn-withdraw"
            onClick={() => setIsWithdrawOpen(true)}
          >
            Withdraw
          </button>
          <button
            type="button"
            className="funds-action-btn funds-btn-pledge"
            onClick={() => setIsPledgeOpen(true)}
          >
            🔒 Pledge Shares
          </button>
          <button
            type="button"
            className="funds-action-btn funds-btn-bank"
            onClick={() => setIsAddBankOpen(true)}
          >
            🏦 Bank Accounts
          </button>

          {/* Statement Exporter */}
          <div className="funds-export-container" ref={exportDropdownRef}>
            <button
              type="button"
              className="funds-action-btn funds-btn-statement"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
            >
              Statement ▾
            </button>
            {isExportMenuOpen && (
              <div className="funds-export-popover">
                <div className="export-menu-header">Export Ledger</div>
                <button
                  type="button"
                  className="funds-export-option"
                  onClick={() => {
                    exportFundsToCSV(transactions, funds, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  📊 CSV File (.csv)
                </button>
                <button
                  type="button"
                  className="funds-export-option"
                  onClick={() => {
                    exportFundsToExcel(transactions, funds, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  📗 Excel Spreadsheet (.xls)
                </button>
                <button
                  type="button"
                  className="funds-export-option"
                  onClick={() => {
                    exportFundsToPDF(transactions, funds, currentUser);
                    setIsExportMenuOpen(false);
                  }}
                >
                  📄 Print / Save as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout (Commodity Cleanly Replaced with Pledging Desk) */}
      <div className="funds-main-grid">
        {/* Left Column: Live Equity Margin Breakdown */}
        <div className="funds-column">
          <div className="funds-column-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v12M16 10H8"></path>
            </svg>
            <h3 className="column-title">Equity Margin Ledger</h3>
          </div>

          <div className="funds-data-card">
            <div className="margin-row prominent">
              <span className="row-label">Available margin</span>
              <span className="row-val text-brand-blue">₹{equity.availableMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Used margin</span>
              <span className="row-val font-medium">₹{equity.usedMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Available cash</span>
              <span className="row-val font-medium text-green">₹{equity.availableCash}</span>
            </div>

            <hr className="funds-divider" />

            <div className="margin-row">
              <span className="row-label">Opening balance</span>
              <span className="row-val">₹{equity.openingBalance}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Payin (Today)</span>
              <span className="row-val text-green font-bold">₹{equity.payin || "0.00"}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Payout (Withdrawals)</span>
              <span className="row-val">₹{equity.payout || "0.00"}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">SPAN Margin</span>
              <span className="row-val">₹{equity.span}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Delivery margin</span>
              <span className="row-val">₹{equity.deliveryMargin}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Exposure Margin</span>
              <span className="row-val">₹{equity.exposure}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Options premium</span>
              <span className="row-val">₹{equity.optionsPremium}</span>
            </div>

            <hr className="funds-divider" />

            <div className="margin-row">
              <span className="row-label">Collateral (Liquid funds)</span>
              <span className="row-val">₹{equity.collateralLiquid}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Collateral (Equity Pledged)</span>
              <span className="row-val text-purple font-bold">₹{equity.collateralEquity}</span>
            </div>
            <div className="margin-row">
              <span className="row-label">Total collateral</span>
              <span className="row-val font-bold">₹{equity.totalCollateral}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Demat Collateral & Margin Pledging Desk */}
        <div className="funds-column">
          <div className="funds-column-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3 className="column-title">Demat Collateral & Stock Pledging</h3>
          </div>

          <div className="pledging-desk-card">
            <div>
              <div className="pledge-desk-intro">
                <h4>Margin Funding via Demat Stocks</h4>
                <p>
                  Pledge approved shares held in your Demat account to generate extra trading margin for Intraday & F&O with standard SEBI haircuts (12.5% – 20%).
                </p>
              </div>

              <div className="pledge-summary-strip">
                <span>
                  <strong>Eligible Holdings:</strong> {holdings.length} Stocks in Demat
                </span>
                <span>
                  <strong>Active Liens:</strong> {pledges.length} Stocks Pledged
                </span>
              </div>

              {pledges.length > 0 ? (
                <div className="active-pledges-table-wrap">
                  <table className="active-pledges-table">
                    <thead>
                      <tr>
                        <th>Pledged Stock</th>
                        <th>Qty</th>
                        <th>Collateral Credit</th>
                        <th>Haircut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pledges.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <strong>{p.symbol}</strong>
                          </td>
                          <td>{p.pledgedQty} sh</td>
                          <td className="font-bold text-green">₹{p.collateralValue.toLocaleString("en-IN")}</td>
                          <td>{p.haircutPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-pledge-box">
                  <p>
                    No shares currently pledged. You can pledge your long-term Demat holdings to trade without liquidating cash.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-open-pledge-modal"
              onClick={() => setIsPledgeOpen(true)}
            >
              🔒 Manage Demat Pledges & Payouts &rsaquo;
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Real-Time Transaction Ledger Desk */}
      <div className="funds-ledger-section">
        <div className="ledger-header-row">
          <div>
            <h4 className="ledger-title">Funds Transaction Ledger</h4>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Audited primary depository records of all payins, payouts, and margin pledge transactions
            </span>
          </div>

          <div className="ledger-filter-tabs">
            <button
              type="button"
              className={`btn-ledger-filter ${ledgerFilter === "ALL" ? "active" : ""}`}
              onClick={() => setLedgerFilter("ALL")}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              className={`btn-ledger-filter ${ledgerFilter === "PAYIN" ? "active" : ""}`}
              onClick={() => setLedgerFilter("PAYIN")}
            >
              Payins ({transactions.filter((t) => t.type === "PAYIN").length})
            </button>
            <button
              type="button"
              className={`btn-ledger-filter ${ledgerFilter === "PAYOUT" ? "active" : ""}`}
              onClick={() => setLedgerFilter("PAYOUT")}
            >
              Withdrawals ({transactions.filter((t) => t.type === "PAYOUT").length})
            </button>
            <button
              type="button"
              className={`btn-ledger-filter ${ledgerFilter === "PLEDGE" ? "active" : ""}`}
              onClick={() => setLedgerFilter("PLEDGE")}
            >
              Pledges ({transactions.filter((t) => t.type === "PLEDGE_MARGIN" || t.type === "UNPLEDGE_MARGIN").length})
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="funds-ledger-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reference ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment Mode / Destination</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx._id || tx.referenceId}>
                  <td style={{ fontSize: "12.5px" }}>{new Date(tx.createdAt).toLocaleString("en-IN")}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{tx.referenceId}</td>
                  <td>
                    <span
                      className={`type-pill ${
                        tx.type === "PAYIN" ? "payin" : tx.type === "PAYOUT" ? "payout" : "pledge"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="font-bold">
                    ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td>{tx.upiId || tx.bankAccount || tx.paymentMethod || "UPI"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        tx.status === "COMPLETED" ? "completed" : tx.status === "PENDING_APPROVAL" ? "pending" : "rejected"
                      }`}
                    >
                      {tx.status === "COMPLETED" ? "✓ Completed" : tx.status === "PENDING_APPROVAL" ? "⏳ Pending Approval" : "✕ Rejected"}
                    </span>
                    {tx.type === "PAYIN" && tx.status === "PENDING_APPROVAL" && <>
                      <button onClick={() => managePendingDeposit(tx._id, "resend")}>Resend email</button>
                      <button onClick={() => managePendingDeposit(tx._id, "cancel")}>Cancel deposit</button>
                    </>}
                  </td>
                  <td style={{ fontSize: "12px", color: "#64748b" }}>{tx.remarks || "-"}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No funds transactions found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      {isAddFundsOpen && (
        <AddFundsModal
          onClose={() => setIsAddFundsOpen(false)}
          onSuccess={() => fetchFundsData()}
          currentUser={currentUser}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {isWithdrawOpen && (
        <WithdrawFundsModal
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={() => fetchFundsData()}
          currentUser={currentUser}
          funds={funds}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {isPledgeOpen && (
        <CollateralPledgeModal
          onClose={() => setIsPledgeOpen(false)}
          onSuccess={() => fetchFundsData()}
          currentUser={currentUser}
          holdings={holdings}
          pledgedHoldings={pledges}
          showToast={showToast}
          refreshPortfolio={refreshPortfolio}
        />
      )}

      {isAddBankOpen && (
        <AddBankAccountModal
          onClose={() => setIsAddBankOpen(false)}
          onSuccess={() => {
            fetchFundsData();
            if (showToast) {
              showToast("Bank Accounts Updated", "New verified bank account is active for withdrawals.", "success");
            }
          }}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      <FundPoliciesModal
        isOpen={isFundPoliciesOpen}
        onClose={() => setIsFundPoliciesOpen(false)}
      />
    </div>
  );
};

export default Funds;
