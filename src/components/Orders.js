import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import GeneralContext from "./GeneralContext";

const API_BASE = "http://localhost:3002";

const Orders = () => {
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const highlightSymbol = location.state?.highlightSymbol;

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [gtts, setGtts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gttLoading, setGttLoading] = useState(false);

  const {
    openBasketModal,
    openGttModal,
    portfolioTrigger,
    currentUser,
    showToast,
    refreshPortfolio,
  } = useContext(GeneralContext);

  const [baskets, setBaskets] = useState([]);
  const [basketsLoading, setBasketsLoading] = useState(false);

  // Fetch dynamic user baskets from MongoDB Atlas
  useEffect(() => {
    setBasketsLoading(true);
    const activeUserId = currentUser?.userId || "ZU9344";
    axios
      .get(`${API_BASE}/allBaskets`, {
        params: { userId: activeUserId },
      })
      .then((res) => {
        setBaskets(Array.isArray(res.data) ? res.data : []);
        setBasketsLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for baskets:", err.message);
        setBaskets([]);
        setBasketsLoading(false);
      });
  }, [portfolioTrigger, currentUser]);

  // Fetch regular orders
  useEffect(() => {
    axios
      .get(`${API_BASE}/allOrders`)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for orders:", err.message);
        setOrders([]);
        setLoading(false);
      });
  }, [portfolioTrigger]);

  // Fetch GTT triggers
  useEffect(() => {
    setGttLoading(true);
    axios
      .get(`${API_BASE}/allGtt`, {
        params: { userId: currentUser?.userId || "ZU9344" },
      })
      .then((res) => {
        setGtts(Array.isArray(res.data) ? res.data : []);
        setGttLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for GTTs:", err.message);
        setGtts([]);
        setGttLoading(false);
      });
  }, [portfolioTrigger, currentUser]);

  const handleCancelGtt = async (id, symbol) => {
    try {
      const res = await axios.post(`${API_BASE}/cancelGtt`, { id });
      if (res.data?.success) {
        showToast("GTT Cancelled", `GTT order for ${symbol} was cancelled.`, "success");
        setGtts((prev) =>
          prev.map((g) => (g._id === id ? { ...g, status: "CANCELLED" } : g))
        );
      }
    } catch (err) {
      showToast("Cancellation Failed", err.response?.data?.message || err.message, "error");
    }
  };

  const handleExecuteQuickBasket = async (basket) => {
    if (!basket || !basket.items || basket.items.length === 0) {
      showToast("Empty Basket", "This basket has no orders to execute.", "error");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/executeBasket`, {
        userId: currentUser?.userId || "ZU9344",
        basketName: basket.name || "Basket",
        items: basket.items,
      });

      if (res.data?.success) {
        showToast(
          "Basket Executed",
          `All ${basket.items.length} orders in "${basket.name}" executed concurrently!`,
          "success"
        );
        refreshPortfolio();
      }
    } catch (err) {
      showToast(
        "Basket Execution Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    }
  };

  const handleDeleteBasket = async (basketId, basketName) => {
    if (!window.confirm(`Are you sure you want to delete "${basketName}"?`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/deleteBasket/${basketId}`);
      if (res.data?.success) {
        showToast("Basket Deleted", `"${basketName}" was removed.`, "info");
        refreshPortfolio();
      }
    } catch (err) {
      showToast("Error", err.response?.data?.message || err.message, "error");
    }
  };

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
          GTT {gtts.length > 0 ? `(${gtts.length})` : ""}
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
        {/* ================= TAB 1: ORDERS ================= */}
        {activeTab === "orders" &&
          (loading ? (
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
                      <tr key={ord._id || idx} className={(highlightOrderId && ord._id === highlightOrderId) || (!highlightOrderId && highlightSymbol && ord.name === highlightSymbol && idx === 0) ? "highlighted-order-row" : ""}>
                        <td>{timeStr}</td>
                        <td>
                          <span
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
          ))}

        {/* ================= TAB 2: GTT ================= */}
        {activeTab === "gtt" &&
          (gttLoading ? (
            <div className="p-4 text-center text-muted">Loading GTT triggers...</div>
          ) : gtts.length > 0 ? (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "12.5px", color: "#666" }}>
                  Active Good-Till-Triggered (GTT) orders are valid for 1 year or until triggered.
                </span>
                <button
                  className="btn-kite-primary"
                  onClick={() => openGttModal("INFY")}
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                  + New GTT
                </button>
              </div>

              <div className="kite-table-container">
                <table className="kite-data-table">
                  <thead>
                    <tr>
                      <th>Created</th>
                      <th>Instrument</th>
                      <th>Type</th>
                      <th>Side</th>
                      <th>Trigger Condition</th>
                      <th>Limit Price</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gtts.map((g) => {
                      const createdDate = g.createdAt
                        ? new Date(g.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Today";

                      return (
                        <tr key={g._id}>
                          <td>{createdDate}</td>
                          <td className="symbol-cell">{g.symbol}</td>
                          <td>
                            <span
                              style={{
                                backgroundColor: "#edf2f7",
                                color: "#4a5568",
                                padding: "2px 6px",
                                borderRadius: "2px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {g.type}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor:
                                  g.transactionType === "BUY" ? "#e3f2fd" : "#fbe9e7",
                                color: g.transactionType === "BUY" ? "#1976d2" : "#d84315",
                                padding: "2px 6px",
                                borderRadius: "2px",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {g.transactionType}
                            </span>
                          </td>
                          <td>
                            {g.type === "SINGLE" ? (
                              <span>Price reaches ₹{Number(g.triggerPrice).toFixed(2)}</span>
                            ) : (
                              <span>
                                SL: ₹{Number(g.stoplossTrigger).toFixed(2)} | Tgt: ₹
                                {Number(g.targetTrigger).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td>
                            ₹
                            {Number(
                              g.orderPrice || g.targetPrice || g.stoplossPrice || 0
                            ).toFixed(2)}
                          </td>
                          <td>{g.qty}</td>
                          <td>
                            <span
                              style={{
                                color:
                                  g.status === "ACTIVE"
                                    ? "#16a34a"
                                    : g.status === "TRIGGERED"
                                    ? "#387ed1"
                                    : "#888888",
                                fontWeight: 600,
                                fontSize: "11.5px",
                              }}
                            >
                              {g.status}
                            </span>
                          </td>
                          <td>
                            {g.status === "ACTIVE" ? (
                              <button
                                style={{
                                  background: "none",
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "3px",
                                  padding: "3px 8px",
                                  color: "#df514c",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  fontWeight: 500,
                                }}
                                onClick={() => handleCancelGtt(g._id, g.symbol)}
                              >
                                Cancel
                              </button>
                            ) : (
                              <span style={{ color: "#aaa", fontSize: "11px" }}>&mdash;</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
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
              <button className="btn-kite-primary" onClick={() => openGttModal("INFY")}>
                + New GTT
              </button>
            </div>
          ))}

        {/* ================= TAB 3: BASKETS ================= */}
        {activeTab === "baskets" && (
          <div className="baskets-view">
            <div className="baskets-header-row">
              <p className="baskets-desc">
                Create baskets of orders to execute multiple orders simultaneously with one click.
              </p>
              <button className="btn-kite-primary" onClick={() => openBasketModal(null)}>
                + New basket
              </button>
            </div>

            {basketsLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
                Loading user baskets...
              </div>
            ) : baskets.length > 0 ? (
              <div className="baskets-cards-grid">
                {baskets.map((b) => (
                  <div className="basket-card-item" key={b._id || b.id}>
                    <div
                      className="basket-card-main"
                      onClick={() => openBasketModal(b)}
                      style={{ cursor: "pointer" }}
                      title="Click to view and edit basket constituents"
                    >
                      <span className="card-basket-name">{b.name}</span>
                      <span className="card-basket-count">
                        {b.items ? b.items.length : (b.itemsCount || 0)} orders
                      </span>
                    </div>
                    <div className="basket-card-meta">
                      <span className="card-basket-margin">
                        Margin: ₹{Number(b.marginRequired || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {b._id && (
                          <button
                            className="btn-delete-basket"
                            title="Delete Basket"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBasket(b._id, b.name);
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #e2e8f0",
                              borderRadius: "3px",
                              padding: "4px 8px",
                              color: "#94a3b8",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                        <button
                          className="btn-execute-basket"
                          onClick={() => handleExecuteQuickBasket(b)}
                        >
                          Execute &rsaquo;
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-view" style={{ padding: "60px 20px", textAlign: "center" }}>
                <div className="empty-state-illustration" style={{ marginBottom: "16px" }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: "0 0 6px 0" }}>
                  No baskets created yet
                </h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
                  Create custom order baskets to execute multi-leg strategies concurrently with 1 click.
                </p>
                <button className="btn-kite-primary" onClick={() => openBasketModal(null)}>
                  + Create your first basket
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SIP ================= */}
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
            <button className="btn-kite-primary" onClick={() => openBasketModal()}>
              Create Stock SIP
            </button>
          </div>
        )}

        {/* ================= TAB 5: ALERTS ================= */}
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
            <button className="btn-kite-primary" onClick={() => openGttModal("RELIANCE")}>
              Set price alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
