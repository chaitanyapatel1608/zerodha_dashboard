import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ipoData as fallbackIpos } from "../../data/mockData";

const IpoCalendarPanel = () => {
  const [activeTab, setActiveTab] = useState("ipos");
  const [ipos, setIpos] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3002/allIpos")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setIpos(res.data);
        } else {
          setIpos(fallbackIpos);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for calendar IPOs, using fallback:", err.message);
        setIpos(fallbackIpos);
      });
  }, []);

  return (
    <div className="ipo-calendar-panel">
      <div className="panel-tabs-header">
        <button
          className={`tab-btn ${activeTab === "ipos" ? "active" : ""}`}
          onClick={() => setActiveTab("ipos")}
        >
          IPOs ({ipos.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "economic" ? "active" : ""}`}
          onClick={() => setActiveTab("economic")}
        >
          Economic Calendar
        </button>
        <button
          className={`tab-btn ${activeTab === "earnings" ? "active" : ""}`}
          onClick={() => setActiveTab("earnings")}
        >
          Earnings Calendar
        </button>
      </div>

      <div className="panel-tab-content">
        {activeTab === "ipos" && (
          <div className="ipos-summary-list">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Dates</th>
                  <th>Price Range</th>
                  <th>Min Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ipos.slice(0, 4).map((ipo) => (
                  <tr key={ipo.symbol}>
                    <td>
                      <div className="company-cell">
                        <span className="symbol">{ipo.symbol}</span>
                        <span className="name">{ipo.name}</span>
                      </div>
                    </td>
                    <td>{ipo.dates}</td>
                    <td>{ipo.priceRange}</td>
                    <td>{ipo.minAmount}</td>
                    <td>
                      <span className={`status-pill ${ipo.status ? ipo.status.toLowerCase() : "upcoming"}`}>
                        {ipo.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel-more-row">
              <Link to="/bids" className="panel-link">
                View all IPOs & Bids &rsaquo;
              </Link>
            </div>
          </div>
        )}

        {activeTab === "economic" && (
          <div className="calendar-list">
            <div className="calendar-item">
              <span className="cal-date">01 Nov</span>
              <div className="cal-desc">
                <strong>RBI MPC Meeting Minutes</strong>
                <small>Monetary policy commentary release</small>
              </div>
              <span className="cal-badge impact-high">High impact</span>
            </div>
            <div className="calendar-item">
              <span className="cal-date">05 Nov</span>
              <div className="cal-desc">
                <strong>US Presidential Election</strong>
                <small>Global macroeconomic volatility</small>
              </div>
              <span className="cal-badge impact-high">High impact</span>
            </div>
            <div className="calendar-item">
              <span className="cal-date">07 Nov</span>
              <div className="cal-desc">
                <strong>US Federal Reserve Rate Decision</strong>
                <small>Consensus expects 25 bps cut</small>
              </div>
              <span className="cal-badge impact-medium">Medium</span>
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="calendar-list">
            <div className="calendar-item">
              <span className="cal-date">04 Nov</span>
              <div className="cal-desc">
                <strong>TATASTEEL Q2 Results</strong>
                <small>Consolidated net profit & margins</small>
              </div>
            </div>
            <div className="calendar-item">
              <span className="cal-date">06 Nov</span>
              <div className="cal-desc">
                <strong>POWERGRID Q2 Results</strong>
                <small>Board meeting for interim dividend</small>
              </div>
            </div>
            <div className="calendar-item">
              <span className="cal-date">08 Nov</span>
              <div className="cal-desc">
                <strong>M&M Q2 Results</strong>
                <small>Auto and farm sector volume growth</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IpoCalendarPanel;
