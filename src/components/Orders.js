import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import GeneralContext from "./GeneralContext";

const Orders = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openBasketModal, baskets } = useContext(GeneralContext);

  useEffect(() => {
    axios
      .get("http://localhost:3002/allOrders")
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for orders:", err.message);
        setOrders([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="orders-page-container">
      <AccountStatusBanner
        message="Account status: Orders placement is active for NSE and BSE segments."
        linkText="Segments settings"
      />

      {/* Sub Tabs Navigation */}
      <div className="page-subtabs-bar">
        <button
          className={`subtab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders {orders.length > 0 ? `(${orders.length})` : ""}
        </button>
        <button
          className={`subtab-btn ${activeTab === "gtt" ? "active" : ""}`}
          onClick={() => setActiveTab("gtt")}
        >
          GTT
        </button>
        <button
          className={`subtab-btn ${activeTab === "baskets" ? "active" : ""}`}
          onClick={() => setActiveTab("baskets")}
        >
          Baskets ({baskets.length})
        </button>
        <button
          className={`subtab-btn ${activeTab === "sip" ? "active" : ""}`}
          onClick={() => setActiveTab("sip")}
        >
          SIP
        </button>
        <button
          className={`subtab-btn ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          Alerts
        </button>
      </div>

      {/* Tab Content */}
      <div className="orders-tab-content">
        {activeTab === "orders" && (
          loading ? (
            <div className="p-4 text-center text-muted">Loading orders...</div>
          ) : orders.length > 0 ? (
            <div className="kite-table-container">
              <table className="kite-data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Instrument</th>
                    <th>Product</th>
                    <th>Qty.</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => {
                    const timeStr = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "Just now";
                    return (
                      <tr key={ord._id || idx}>
                        <td>{timeStr}</td>
                        <td>
                          <span
                            className={
                              ord.mode === "BUY" ? "order-mode-badge" : "order-mode-badge"
                            }
                            style={{
                              backgroundColor: ord.mode === "BUY" ? "#4184f3" : "#df514c",
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: "2px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {ord.mode}
                          </span>
                        </td>
                        <td className="symbol-cell">{ord.name}</td>
                        <td>
                          <span className="product-tag">{ord.product || "CNC"}</span>
                        </td>
                        <td>{ord.qty}</td>
                        <td>₹{Number(ord.price || 0).toFixed(2)}</td>
                        <td>
                          <span
                            style={{
                              color: "#4caf50",
                              fontWeight: 500,
                              fontSize: "0.85rem",
                            }}
                          >
                            {ord.status || "COMPLETE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-view">
              <div className="empty-state-illustration">
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h4 className="empty-state-title">You haven't placed any orders today</h4>
              <p className="empty-state-subtitle">
                Place orders directly from your watchlist or search bar.
              </p>
              <div className="empty-state-actions">
                <Link to="/" className="btn-kite-primary">
                  Get started
                </Link>
                <a href="#history" className="subtle-link" onClick={(e) => e.preventDefault()}>
                  View tradebook history &rsaquo;
                </a>
              </div>
            </div>
          )
        )}

        {activeTab === "gtt" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h4 className="empty-state-title">No active GTT triggers</h4>
            <p className="empty-state-subtitle">
              Create Good-Till-Triggered orders to buy or sell when stock reaches your target.
            </p>
            <button
              className="btn-kite-primary"
              onClick={() => alert("GTT order creation dialog")}
            >
              New GTT
            </button>
          </div>
        )}

        {activeTab === "baskets" && (
          <div className="baskets-view">
            <div className="baskets-header-row">
              <p className="baskets-desc">
                Create baskets of orders to execute multiple orders simultaneously with one click.
              </p>
              <button className="btn-kite-primary" onClick={openBasketModal}>
                + New basket
              </button>
            </div>
            <div className="baskets-cards-grid">
              {baskets.map((b) => (
                <div className="basket-card-item" key={b.id} onClick={openBasketModal}>
                  <div className="basket-card-main">
                    <span className="card-basket-name">{b.name}</span>
                    <span className="card-basket-count">{b.itemsCount} orders</span>
                  </div>
                  <div className="basket-card-meta">
                    <span className="card-basket-margin">Margin: {b.margin}</span>
                    <button className="btn-execute-basket">Execute &rsaquo;</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "sip" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h4 className="empty-state-title">No stock SIP schedules</h4>
            <p className="empty-state-subtitle">
              Set up automated periodic investments in your favorite stocks and ETFs.
            </p>
            <button
              className="btn-kite-primary"
              onClick={() => alert("New Stock SIP modal")}
            >
              Create Stock SIP
            </button>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="empty-state-view">
            <div className="empty-state-illustration">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <h4 className="empty-state-title">No price alerts created</h4>
            <p className="empty-state-subtitle">
              Get notified immediately when prices cross your defined boundaries.
            </p>
            <button
              className="btn-kite-primary"
              onClick={() => alert("Create Price Alert")}
            >
              Set price alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
