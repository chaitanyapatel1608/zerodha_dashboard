import React, { useState, useEffect, useMemo, useContext } from "react";
import GeneralContext from "./GeneralContext";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import { positionsData } from "../data/mockData";

const Positions = () => {
  const { portfolioTrigger } = useContext(GeneralContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:3002/allPositions")
      .then((res) => {
        setPositions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable, using fallback positionsData:", err.message);
        setPositions(positionsData);
        setLoading(false);
      });
  }, [portfolioTrigger]);

  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const sym = p.instrument || p.name || "";
      return sym.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [positions, searchTerm]);

  const totalPnl = filteredPositions.reduce((acc, p) => acc + (p.pnl || 0), 0);
  const isPnlPositive = totalPnl >= 0;

  return (
    <div className="positions-page-container">
      <AccountStatusBanner
        message="Account status: Intraday square-off begins at 15:20 for equity MIS and 15:25 for F&O."
        linkText="RMS policy rules"
      />

      <div className="positions-top-bar">
        <div className="title-group">
          <h2 className="section-heading">Positions ({filteredPositions.length})</h2>
        </div>
        <div className="positions-actions-right">
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="holdings-search-input"
          />
          <a
            href="#analytics"
            className="subtle-link"
            onClick={(e) => {
              e.preventDefault();
              alert("F&O Analytics and Greeks");
            }}
          >
            Analytics &rsaquo;
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center text-muted">Loading positions from database...</div>
      ) : filteredPositions.length === 0 ? (
        <div className="empty-state-view">
          <div className="empty-state-illustration">
            <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
              <path d="M12 20v-6M6 20V10M18 20V4"></path>
            </svg>
          </div>
          <h4 className="empty-state-title">No open positions</h4>
          <p className="empty-state-subtitle">
            You do not have any open intraday or carryforward positions today.
          </p>
        </div>
      ) : (
        <>
          <div className="kite-table-container">
            <table className="kite-data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Instrument</th>
                  <th>Qty.</th>
                  <th>Avg.</th>
                  <th>LTP</th>
                  <th>P&L</th>
                  <th>Chg.</th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((pos, idx) => {
                  const symbol = pos.instrument || pos.name;
                  const avg = pos.avg || 0;
                  const ltp = pos.ltp || pos.price || 0;
                  const pnl = pos.pnl || 0;
                  const chg = pos.chg || pos.net || "0.00%";
                  const isProfit = pos.isProfit !== undefined ? pos.isProfit : pnl >= 0;

                  return (
                    <tr key={pos._id || symbol || idx}>
                      <td>
                        <span className="product-tag">{pos.product || "MIS"}</span>
                      </td>
                      <td className="symbol-cell">{symbol}</td>
                      <td className={pos.qty >= 0 ? "text-up" : "text-down"}>
                        {pos.qty > 0 ? `+${pos.qty}` : pos.qty}
                      </td>
                      <td>{avg.toFixed(2)}</td>
                      <td>{ltp.toFixed(2)}</td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {isProfit ? "+" : ""}
                        {pnl.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className={isProfit ? "text-up" : "text-down"}>
                        {chg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="holdings-summary-footer">
            <div className="summary-col">
              <span className={`summary-val ${isPnlPositive ? "text-up" : "text-down"}`}>
                {isPnlPositive ? "+" : ""}₹
                {totalPnl.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="summary-label">Total Realized & Unrealized P&L</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Positions;
