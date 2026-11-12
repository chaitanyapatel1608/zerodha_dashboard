import React, { useState } from "react";
import axios from "axios";
import "./CollateralPledgeModal.css";

import { API_BASE, AUTH_PORTAL_URL } from "../../config/api";

const CollateralPledgeModal = ({
  onClose,
  onSuccess,
  currentUser,
  holdings = [],
  pledgedHoldings = [],
  showToast,
  refreshPortfolio,
}) => {
  const [activeTab, setActiveTab] = useState("pledge"); // "pledge" | "active"
  const [selectedStock, setSelectedStock] = useState(null);
  const [pledgeQty, setPledgeQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getHaircut = (sym) => {
    const s = (sym || "").toUpperCase();
    if (s === "RELIANCE" || s === "TCS") return 12.5;
    if (s === "INFY" || s === "HDFCBANK" || s === "ICICIBANK") return 15.0;
    return 20.0;
  };

  const handlePledgeSubmit = async (stock) => {
    setErrorMsg("");
    const qty = selectedStock?.symbol === stock.name ? pledgeQty : 1;
    const price = stock.price || stock.ltp || 100;

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/pledgeHolding`, {
        userId: currentUser?.userId,
        symbol: stock.name || stock.instrument,
        companyName: stock.name,
        quantity: qty,
        marketPrice: price,
      });

      if (res.data?.success) {
        const addedCollateral = Number(res.data?.collateralValue ?? res.data?.pledge?.collateralValue ?? 0);
        if (showToast) {
          showToast(
            "Shares Pledged for Margin",
            `Successfully pledged ${qty} shares of ${stock.name || stock.symbol || "shares"}. ₹${addedCollateral.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} margin added!`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onSuccess) onSuccess();
        setSelectedStock(null);
      } else {
        setErrorMsg(res.data?.message || "Failed to pledge shares.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to pledge shares.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpledge = async (pledge) => {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/unpledgeHolding`, {
        userId: currentUser?.userId,
        pledgeId: pledge._id,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Shares Unpledged",
            `Successfully unpledged ${pledge.pledgedQty} shares of ${pledge.symbol}. Demat lien released.`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data?.message || "Failed to unpledge shares.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to unpledge shares.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="funds-modal-backdrop" onClick={onClose}>
      <div className="funds-modal-box" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
        <div className="funds-modal-header">
          <div>
            <div className="funds-badge-row">
              <span className="funds-tag-pill" style={{ background: "#faf5ff", color: "#7e22ce", borderColor: "#ddd6fe" }}>
                SEBI Margin Pledge
              </span>
              <span className="funds-time-pill">Instant Intraday & F&O Margin</span>
            </div>
            <h3 className="funds-modal-title">Demat Margin Pledging Desk</h3>
            <span className="funds-modal-subtitle">Pledge holding shares to generate collateral trading margin</span>
          </div>
          <button className="funds-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {errorMsg && <div className="funds-error-banner">{errorMsg}</div>}

        {/* Subtabs: Pledge Holdings vs Active Pledges */}
        <div className="pledge-subtabs-row">
          <button
            type="button"
            className={`pledge-subtab-btn ${activeTab === "pledge" ? "active" : ""}`}
            onClick={() => setActiveTab("pledge")}
          >
            Eligible Holdings ({holdings.length})
          </button>
          <button
            type="button"
            className={`pledge-subtab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Pledged Collateral ({pledgedHoldings.length})
          </button>
        </div>

        {activeTab === "pledge" ? (
          <div className="pledge-list-container">
            {holdings.length === 0 ? (
              <div className="empty-pledge-note">No holdings found in Demat account to pledge.</div>
            ) : (
              <table className="pledge-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Demat Qty</th>
                    <th>Price</th>
                    <th>Haircut</th>
                    <th>Collateral / sh</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const sym = h.name || h.instrument;
                    const price = Number(h.price || h.ltp || 100);
                    const haircut = getHaircut(sym);
                    const collateralPerShare = price * (1 - haircut / 100);
                    const isSelected = selectedStock?.name === sym;

                    return (
                      <tr key={sym}>
                        <td>
                          <strong>{sym}</strong>
                        </td>
                        <td>{h.qty} sh</td>
                        <td>₹{price.toFixed(2)}</td>
                        <td>
                          <span className="haircut-pill">{haircut}%</span>
                        </td>
                        <td className="font-bold text-green">₹{collateralPerShare.toFixed(2)}</td>
                        <td style={{ textAlign: "right" }}>
                          {isSelected ? (
                            <div className="pledge-action-inline">
                              <input
                                type="number"
                                min="1"
                                max={h.qty}
                                value={pledgeQty}
                                onChange={(e) => setPledgeQty(Math.max(1, Math.min(h.qty, parseInt(e.target.value) || 1)))}
                                className="input-pledge-inline"
                              />
                              <button
                                type="button"
                                className="btn-confirm-pledge"
                                onClick={() => handlePledgeSubmit(h)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "..." : "Pledge"}
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-inline"
                                onClick={() => setSelectedStock(null)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-select-pledge"
                              onClick={() => {
                                setSelectedStock(h);
                                setPledgeQty(Math.min(h.qty, 5));
                              }}
                            >
                              Pledge
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="pledge-list-container">
            {pledgedHoldings.length === 0 ? (
              <div className="empty-pledge-note">No active pledged collateral. Select stocks to pledge for margin.</div>
            ) : (
              <table className="pledge-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Stock</th>
                    <th>Pledged Qty</th>
                    <th>Collateral Value</th>
                    <th>Haircut</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pledgedHoldings.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: "monospace", fontSize: "11.5px" }}>{p.pledgeRef}</td>
                      <td>
                        <strong>{p.symbol}</strong>
                      </td>
                      <td>{p.pledgedQty} sh</td>
                      <td className="font-bold text-green">₹{Number(p.collateralValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{p.haircutPercent}%</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-unpledge"
                          onClick={() => handleUnpledge(p)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "..." : "Unpledge"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="pledge-footer-note">
          <span>🔒 SEBI Depository Pledge:</span> Shares remain held in your Demat account; corporate benefits (dividends, bonuses) continue to accrue to you.
        </div>

        <div className="funds-modal-actions" style={{ marginTop: "16px" }}>
          <button type="button" className="btn-funds-cancel" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollateralPledgeModal;
