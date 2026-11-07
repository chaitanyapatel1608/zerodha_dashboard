import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import SipCreateModal from "./overlays/SipCreateModal";
import SipExecuteModal from "./overlays/SipExecuteModal";
import SipDeleteModal from "./overlays/SipDeleteModal";
import AlertCreateModal from "./overlays/AlertCreateModal";
import AlertDeleteModal from "./overlays/AlertDeleteModal";
import BasketExecuteModal from "./overlays/BasketExecuteModal";
import BasketDeleteModal from "./overlays/BasketDeleteModal";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AccountStatusBanner from "./common/AccountStatusBanner";
import GeneralContext from "./GeneralContext";

const API_BASE = "http://localhost:3002";

const WEEK_DAY_NAMES = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;
  const highlightSymbol = location.state?.highlightSymbol;

  const [activeTab, setActiveTab] = useState(location.state?.defaultSubTab || "orders");
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
  const [basketToExecute, setBasketToExecute] = useState(null);
  const [isExecutingBasket, setIsExecutingBasket] = useState(false);
  const [basketToDelete, setBasketToDelete] = useState(null);
  const [isDeletingBasket, setIsDeletingBasket] = useState(false);
  const [basketViewMode, setBasketViewMode] = useState("cards"); // "cards" or "table"
  const [basketSubView, setBasketSubView] = useState("myBaskets"); // "myBaskets" or "templates"
  const [basketSearchTerm, setBasketSearchTerm] = useState("");
  const [basketTemplates, setBasketTemplates] = useState([]);
  const [addingTemplateCode, setAddingTemplateCode] = useState(null);
  const [sips, setSips] = useState([]);
  const [sipsLoading, setSipsLoading] = useState(false);
  const [isSipModalOpen, setIsSipModalOpen] = useState(false);
  const [executingSipId, setExecutingSipId] = useState(null);
  const [sipSearchTerm, setSipSearchTerm] = useState("");
  const [sipView, setSipView] = useState("explore");
  const [marketSipsCatalog, setMarketSipsCatalog] = useState([]);
  const [marketCategoryFilter, setMarketCategoryFilter] = useState("ALL");
  const [selectedMarketCodeForModal, setSelectedMarketCodeForModal] = useState(null);
  const [sipToExecute, setSipToExecute] = useState(null);
  const [userAvailableMargin, setUserAvailableMargin] = useState(124500);
  const [sipToDelete, setSipToDelete] = useState(null);
  const [isDeletingSip, setIsDeletingSip] = useState(false);
  const [openMenuSipId, setOpenMenuSipId] = useState(null);

  // Price Alerts (Sentinel) States
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertFilter, setAlertFilter] = useState("ALL"); // ALL, ACTIVE, TRIGGERED, DISABLED
  const [alertSearchTerm, setAlertSearchTerm] = useState("");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [isDeletingAlert, setIsDeletingAlert] = useState(false);
  const [openAlertMenuId, setOpenAlertMenuId] = useState(null);

  // Close dropdown menus when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".sip-actions-menu-container")) {
        setOpenMenuSipId(null);
      }
      if (!e.target.closest(".alert-actions-menu-container")) {
        setOpenAlertMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for navigation state from top-nav Baskets dropdown or Holdings Coin link
  useEffect(() => {
    if (location.state?.defaultSubTab) {
      setActiveTab(location.state.defaultSubTab);
    }
    if (location.state?.openSipModal) {
      if (location.state?.marketCode) {
        setSelectedMarketCodeForModal(location.state.marketCode);
      }
      setIsSipModalOpen(true);
    }
    if (location.state?.executeBasketId && baskets.length > 0) {
      const target = baskets.find((b) => b._id === location.state.executeBasketId);
      if (target) {
        setBasketToExecute(target);
      }
    }
  }, [location.state, baskets]);

  // Fetch live margin for execution validation
  useEffect(() => {
    if (currentUser?.userId) {
      axios
        .get(`${API_BASE}/userFunds`, { params: { userId: currentUser.userId } })
        .then((res) => {
          if (res.data?.equity?.availableMargin !== undefined) {
            const raw = res.data.equity.availableMargin;
            const parsed = typeof raw === "string" ? parseFloat(raw.replace(/,/g, "")) : Number(raw || 0);
            setUserAvailableMargin(isNaN(parsed) ? 124500 : parsed);
          }
        })
        .catch(() => {});
    }
  }, [currentUser, portfolioTrigger]);

  // Fetch dynamic user baskets from MongoDB Atlas
  useEffect(() => {
    setBasketsLoading(true);
    const activeUserId = currentUser?.userId;
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

  // Fetch curated strategy templates
  useEffect(() => {
    axios
      .get(`${API_BASE}/basketTemplates`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBasketTemplates(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch regular orders
  useEffect(() => {
    const activeUserId = currentUser?.userId;
    axios
      .get(`${API_BASE}/allOrders`, {
        params: { userId: activeUserId },
      })
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for orders:", err.message);
        setOrders([]);
        setLoading(false);
      });
  }, [portfolioTrigger, currentUser]);

  // Fetch GTT triggers
  useEffect(() => {
    setGttLoading(true);
    axios
      .get(`${API_BASE}/allGtt`, {
        params: { userId: currentUser?.userId },
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

  // Fetch user SIPs from MongoDB Atlas
  const fetchSips = useCallback(() => {
    setSipsLoading(true);
    const activeUserId = currentUser?.userId;
    axios
      .get(`${API_BASE}/allSips`, { params: { userId: activeUserId } })
      .then((res) => {
        setSips(Array.isArray(res.data) ? res.data : []);
        setSipsLoading(false);
      })
      .catch((err) => {
        console.warn("Backend unavailable for SIPs:", err.message);
        setSips([]);
        setSipsLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    fetchSips();
  }, [fetchSips, portfolioTrigger]);

  // Fetch 50 real market SIPs catalog
  useEffect(() => {
    axios
      .get(`${API_BASE}/marketSipsCatalog`)
      .then((res) => {
        setMarketSipsCatalog(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.warn("Backend unavailable for market SIPs:", err.message);
        setMarketSipsCatalog([]);
      });
  }, []);

  const handleExecuteSipNow = (sip) => {
    setSipToExecute(sip);
  };

  const handleConfirmExecuteSip = async () => {
    if (!sipToExecute) return;
    setExecutingSipId(sipToExecute._id);
    try {
      const res = await axios.post(`${API_BASE}/executeSipNow/${sipToExecute._id}`);
      if (res.data?.success) {
        showToast(
          "SIP Executed!",
          `Placed ${res.data.executedOrders?.length || 0} orders for "${sipToExecute.name}".`,
          "success"
        );
        fetchSips();
        refreshPortfolio();
        setSipToExecute(null);
      }
    } catch (err) {
      showToast(
        "Execution Skipped",
        err.response?.data?.message || err.message,
        "error"
      );
      fetchSips();
      setSipToExecute(null);
    } finally {
      setExecutingSipId(null);
    }
  };

  const handleToggleSipStatus = async (sip) => {
    try {
      const res = await axios.patch(`${API_BASE}/toggleSipStatus/${sip._id}`);
      if (res.data?.success) {
        showToast(
          "SIP Updated",
          `"${sip.name}" is now ${res.data.sip?.status?.toLowerCase()}.`,
          "info"
        );
        fetchSips();
      }
    } catch (err) {
      showToast("Error", "Failed to update SIP status", "error");
    }
  };

  const handleDeleteSip = (sip) => {
    setSipToDelete(sip);
  };

  const handleConfirmDeleteSip = async () => {
    if (!sipToDelete) return;
    setIsDeletingSip(true);
    try {
      const res = await axios.delete(`${API_BASE}/deleteSip/${sipToDelete._id}`);
      if (res.data?.success) {
        showToast("SIP Cancelled", `Stock SIP "${sipToDelete.name}" was cancelled.`, "info");
        fetchSips();
        setSipToDelete(null);
      }
    } catch (err) {
      showToast("Error", "Failed to cancel SIP", "error");
    } finally {
      setIsDeletingSip(false);
    }
  };

  // Price Alerts Handlers
  const fetchAlerts = useCallback(() => {
    const activeUserId = currentUser?.userId;
    setAlertsLoading(true);
    axios
      .get(`${API_BASE}/alerts`, { params: { userId: activeUserId } })
      .then((res) => {
        setAlerts(Array.isArray(res.data) ? res.data : []);
        setAlertsLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch alerts:", err.message);
        setAlerts([]);
        setAlertsLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "alerts") {
      fetchAlerts();
    }
  }, [activeTab, fetchAlerts, portfolioTrigger]);

  const handleToggleAlertStatus = async (alert) => {
    try {
      const res = await axios.patch(`${API_BASE}/toggleAlertStatus/${alert._id}`);
      if (res.data?.success) {
        showToast(
          "Alert Updated",
          `Alert for ${alert.symbol} is now ${res.data.alert?.status?.toLowerCase()}.`,
          "info"
        );
        fetchAlerts();
      }
    } catch (err) {
      showToast("Error", "Failed to update alert status", "error");
    }
  };

  const handleResetAlert = async (alert) => {
    try {
      const res = await axios.post(`${API_BASE}/resetAlert/${alert._id}`);
      if (res.data?.success) {
        showToast("Alert Re-Armed", `Price alert for ${alert.symbol} is now active.`, "success");
        fetchAlerts();
      }
    } catch (err) {
      showToast("Error", "Failed to re-arm alert", "error");
    }
  };

  const handleConfirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    setIsDeletingAlert(true);
    try {
      const res = await axios.delete(`${API_BASE}/deleteAlert/${alertToDelete._id}`);
      if (res.data?.success) {
        showToast("Alert Deleted", `Price alert for ${alertToDelete.symbol} was removed.`, "info");
        fetchAlerts();
        setAlertToDelete(null);
      }
    } catch (err) {
      showToast("Error", "Failed to delete alert", "error");
    } finally {
      setIsDeletingAlert(false);
    }
  };

  const filteredMarketSips = useMemo(() => {
    return marketSipsCatalog.filter((item) => {
      const matchesCategory =
        marketCategoryFilter === "ALL" ||
        (marketCategoryFilter === "STOCK" && item.category === "Bluechip Stock") ||
        (marketCategoryFilter === "ETF" && item.category === "ETF & Index") ||
        (marketCategoryFilter === "THEMATIC" && item.category === "Thematic Strategy");

      const q = sipSearchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.symbol?.toLowerCase().includes(q) ||
        item.tag?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [marketSipsCatalog, marketCategoryFilter, sipSearchTerm]);

  const filteredSips = useMemo(() => {
    return sips.filter((s) => {
      const q = sipSearchTerm.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.basketName?.toLowerCase().includes(q) ||
        s.frequency?.toLowerCase().includes(q)
      );
    });
  }, [sips, sipSearchTerm]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesFilter =
        alertFilter === "ALL" || a.status === alertFilter;
      const q = alertSearchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        a.symbol?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [alerts, alertFilter, alertSearchTerm]);

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

  // Basket Metrics & Filtering
  const totalBasketOrdersCount = useMemo(() => {
    return baskets.reduce((sum, b) => sum + (b.items ? b.items.length : (b.itemsCount || 0)), 0);
  }, [baskets]);

  const totalBasketMarginRequired = useMemo(() => {
    return baskets.reduce((sum, b) => sum + Number(b.marginRequired || 0), 0);
  }, [baskets]);

  const filteredBaskets = useMemo(() => {
    if (!basketSearchTerm.trim()) return baskets;
    const q = basketSearchTerm.trim().toLowerCase();
    return baskets.filter((b) => {
      const nameMatch = (b.name || "").toLowerCase().includes(q);
      const itemsMatch = b.items && b.items.some((it) => (it.symbol || it.name || "").toLowerCase().includes(q));
      return nameMatch || itemsMatch;
    });
  }, [baskets, basketSearchTerm]);

  const handleOpenExecuteBasket = (basket) => {
    setBasketToExecute(basket);
  };

  const handleConfirmExecuteBasket = async (basket) => {
    if (!basket || !basket.items || basket.items.length === 0) {
      showToast("Empty Basket", "This basket has no orders to execute.", "error");
      return;
    }
    setIsExecutingBasket(true);
    try {
      const res = await axios.post(`${API_BASE}/executeBasket`, {
        userId: currentUser?.userId,
        basketName: basket.name || "Basket",
        items: basket.items,
      });

      if (res.data?.success) {
        showToast(
          "Basket Executed Successfully",
          `All ${basket.items.length} orders in "${basket.name}" executed concurrently at NSE!`,
          "success"
        );
        refreshPortfolio();
        setBasketToExecute(null);
      }
    } catch (err) {
      showToast(
        "Basket Execution Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    } finally {
      setIsExecutingBasket(false);
    }
  };

  const handleOpenDeleteBasket = (basket) => {
    setBasketToDelete(basket);
  };

  const handleConfirmDeleteBasket = async (basket) => {
    if (!basket?._id) return;
    setIsDeletingBasket(true);
    try {
      const res = await axios.delete(`${API_BASE}/deleteBasket/${basket._id}`);
      if (res.data?.success) {
        showToast("Basket Deleted", `"${basket.name}" was permanently removed.`, "info");
        refreshPortfolio();
        setBaskets((prev) => prev.filter((b) => b._id !== basket._id));
        setBasketToDelete(null);
      }
    } catch (err) {
      showToast("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setIsDeletingBasket(false);
    }
  };

  const handleAddTemplateToBaskets = async (template) => {
    if (!template?.code) return;
    setAddingTemplateCode(template.code);
    try {
      const res = await axios.post(`${API_BASE}/addTemplateToBaskets`, {
        userId: currentUser?.userId,
        templateCode: template.code,
      });
      if (res.data?.success) {
        showToast("Strategy Added", `"${template.name}" added to your Demat baskets!`, "success");
        refreshPortfolio();
        setBasketSubView("myBaskets");
      }
    } catch (err) {
      showToast("Failed to Add Strategy", err.response?.data?.message || err.message, "error");
    } finally {
      setAddingTemplateCode(null);
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
          SIP {sips.length > 0 ? `(${sips.length})` : ""}</button>
        <button
          className={`subtab-btn ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          Alerts {alerts.length > 0 ? `(${alerts.length})` : ""}
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

        {/* ================= TAB 3: BASKETS (CTO-LEVEL MULTI-TENANT ENGINE) ================= */}
        {activeTab === "baskets" && (
          <div className="baskets-view-container">
            {/* 1. High-Precision KPI Metrics Bar */}
            <div className="baskets-kpi-bar">
              <div className="basket-kpi-card">
                <span className="kpi-label">Active Demat Baskets</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{baskets.length}</span>
                  <span className="kpi-badge primary">Baskets</span>
                </div>
                <span className="kpi-sub">Custom multi-leg portfolios</span>
              </div>

              <div className="basket-kpi-card">
                <span className="kpi-label">Total Ready Orders</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">{totalBasketOrdersCount}</span>
                  <span className="kpi-badge neutral">Order Legs</span>
                </div>
                <span className="kpi-sub">Ready for concurrent execution</span>
              </div>

              <div className="basket-kpi-card">
                <span className="kpi-label">Combined Margin Required</span>
                <div className="kpi-value-row">
                  <span className="kpi-num">
                    ₹{Number(totalBasketMarginRequired).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="kpi-sub">Calculated with CNC & MIS leverage</span>
              </div>

              <div className="basket-kpi-card">
                <span className="kpi-label">Available Demat Cash</span>
                <div className="kpi-value-row">
                  <span className={`kpi-num ${(Number.isFinite(userAvailableMargin) ? userAvailableMargin : 0) >= totalBasketMarginRequired ? "text-green" : "text-amber"}`}>
                    ₹{Number(Number.isFinite(userAvailableMargin) ? userAvailableMargin : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`kpi-badge ${(Number.isFinite(userAvailableMargin) ? userAvailableMargin : 0) >= totalBasketMarginRequired ? "adequate" : "low"}`}>
                    {(Number.isFinite(userAvailableMargin) ? userAvailableMargin : 0) >= totalBasketMarginRequired ? "✓ Adequate" : "⚠ Low Margin"}
                  </span>
                </div>
                <span className="kpi-sub">Instant cash margin balance</span>
              </div>
            </div>

            {/* 2. Sub-view Navigation Bar (My Baskets vs Strategy Templates) */}
            <div className="baskets-subview-nav">
              <div className="baskets-nav-pills">
                <button
                  type="button"
                  className={`basket-nav-pill ${basketSubView === "myBaskets" ? "active" : ""}`}
                  onClick={() => setBasketSubView("myBaskets")}
                >
                  My Demat Baskets
                  <span className="pill-badge-count">{baskets.length}</span>
                </button>
                <button
                  type="button"
                  className={`basket-nav-pill ${basketSubView === "templates" ? "active" : ""}`}
                  onClick={() => setBasketSubView("templates")}
                >
                  ⭐ Explore Strategy Templates
                  <span className="pill-badge-count">{basketTemplates.length || 6}</span>
                </button>
              </div>

              <div className="baskets-toolbar-actions">
                {basketSubView === "myBaskets" && (
                  <>
                    <div className="basket-search-box">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search baskets by name or stock..."
                        value={basketSearchTerm}
                        onChange={(e) => setBasketSearchTerm(e.target.value)}
                        className="basket-search-field"
                      />
                      {basketSearchTerm && (
                        <button
                          type="button"
                          className="basket-clear-search-btn"
                          onClick={() => setBasketSearchTerm("")}
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    <div className="basket-view-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${basketViewMode === "cards" ? "active" : ""}`}
                        onClick={() => setBasketViewMode("cards")}
                        title="Card Grid View"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${basketViewMode === "table" ? "active" : ""}`}
                        onClick={() => setBasketViewMode("table")}
                        title="High-Density Table View"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </>
                )}

                <button
                  className="btn-kite-primary btn-new-basket"
                  onClick={() => openBasketModal(null)}
                >
                  + New Basket
                </button>
              </div>
            </div>

            {/* 3. Sub-View Body: MY BASKETS */}
            {basketSubView === "myBaskets" && (
              <>
                {basketsLoading ? (
                  <div className="baskets-loading-state">
                    <span className="baskets-spinner"></span>
                    <span>Loading your Demat order baskets...</span>
                  </div>
                ) : filteredBaskets.length > 0 ? (
                  basketViewMode === "cards" ? (
                    /* Cards Grid View */
                    <div className="baskets-cards-grid">
                      {filteredBaskets.map((b) => {
                        const items = Array.isArray(b.items) ? b.items : [];
                        const margin = Number(b.marginRequired || 0);
                        const isMarginOk = userAvailableMargin >= margin;

                        return (
                          <div className="basket-pro-card" key={b._id || b.id}>
                            <div className="basket-pro-card-header">
                              <div
                                className="basket-title-area"
                                onClick={() => openBasketModal(b)}
                                title="Click to view and edit constituent orders"
                              >
                                <span className="basket-folder-icon">📁</span>
                                <h4 className="basket-name-text">{b.name}</h4>
                              </div>
                              <div className="basket-tags-area">
                                <span className="basket-legs-badge">{items.length} orders</span>
                                <span className="basket-exch-badge">NSE CNC</span>
                              </div>
                            </div>

                            {/* Constituent Preview Chips */}
                            <div
                              className="basket-constituents-preview"
                              onClick={() => openBasketModal(b)}
                              title="Click to view full basket"
                            >
                              {items.length > 0 ? (
                                <>
                                  {items.slice(0, 3).map((it, idx) => (
                                    <span
                                      key={idx}
                                      className={`constituent-chip ${(it.mode || "BUY").toLowerCase()}`}
                                    >
                                      <strong>{it.mode || "BUY"}</strong> {it.qty || 1}× {it.symbol || it.name}
                                    </span>
                                  ))}
                                  {items.length > 3 && (
                                    <span className="constituent-chip-more">
                                      +{items.length - 3} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="no-constituents-hint">No orders added yet</span>
                              )}
                            </div>

                            {/* Card Footer: Margin & Actions */}
                            <div className="basket-pro-card-footer">
                              <div className="basket-margin-col">
                                <span className="margin-label">Required Margin</span>
                                <strong className="margin-num">
                                  ₹{margin.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </strong>
                                <span className={`margin-check-pill ${isMarginOk ? "ok" : "warn"}`}>
                                  {isMarginOk ? "✓ Margin Ready" : "⚠ Low Balance"}
                                </span>
                              </div>

                              <div className="basket-actions-cluster">
                                <button
                                  type="button"
                                  className="btn-basket-action-edit"
                                  title="Edit Basket Constituents"
                                  onClick={() => openBasketModal(b)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-basket-action-delete"
                                  title="Delete Basket"
                                  onClick={() => handleOpenDeleteBasket(b)}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn-basket-action-execute"
                                  title="Review & Execute Basket"
                                  onClick={() => handleOpenExecuteBasket(b)}
                                >
                                  ⚡ Execute
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* High-Density Table View */
                    <div className="baskets-table-container">
                      <table className="baskets-dense-table">
                        <thead>
                          <tr>
                            <th>Basket Strategy</th>
                            <th>Constituent Orders Preview</th>
                            <th>Total Legs</th>
                            <th>Required Margin</th>
                            <th>Margin Health</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBaskets.map((b) => {
                            const items = Array.isArray(b.items) ? b.items : [];
                            const margin = Number(b.marginRequired || 0);
                            const isMarginOk = userAvailableMargin >= margin;

                            return (
                              <tr key={b._id || b.id}>
                                <td>
                                  <div
                                    className="dense-basket-name"
                                    onClick={() => openBasketModal(b)}
                                    title="Click to edit basket"
                                  >
                                    <strong>{b.name}</strong>
                                    <span className="dense-basket-sub">NSE Multi-Leg</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="dense-chips-row">
                                    {items.slice(0, 3).map((it, idx) => (
                                      <span key={idx} className={`dense-chip ${(it.mode || "BUY").toLowerCase()}`}>
                                        {it.mode || "BUY"} {it.qty}× {it.symbol || it.name}
                                      </span>
                                    ))}
                                    {items.length > 3 && (
                                      <span className="dense-chip-more">+{items.length - 3}</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className="dense-legs-badge">{items.length} orders</span>
                                </td>
                                <td>
                                  <strong className="dense-margin-val">
                                    ₹{margin.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </td>
                                <td>
                                  <span className={`dense-health-pill ${isMarginOk ? "ok" : "warn"}`}>
                                    {isMarginOk ? "✓ Margin Adequate" : "⚠ Low Margin"}
                                  </span>
                                </td>
                                <td>
                                  <div className="dense-actions-group">
                                    <button
                                      type="button"
                                      className="btn-dense-edit"
                                      onClick={() => openBasketModal(b)}
                                      title="Edit Basket"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-dense-delete"
                                      onClick={() => handleOpenDeleteBasket(b)}
                                      title="Delete Basket"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-dense-execute"
                                      onClick={() => handleOpenExecuteBasket(b)}
                                      title="Execute Basket"
                                    >
                                      Execute
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : baskets.length > 0 ? (
                  <div className="baskets-empty-search">
                    <p>No baskets match "<strong>{basketSearchTerm}</strong>".</p>
                    <button
                      type="button"
                      className="btn-clear-search-pill"
                      onClick={() => setBasketSearchTerm("")}
                    >
                      Clear search
                    </button>
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
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                      <button className="btn-kite-primary" onClick={() => openBasketModal(null)}>
                        + Create Custom Basket
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setBasketSubView("templates")}
                        style={{ border: "1px solid #387ed1", color: "#387ed1", background: "#f0f7ff" }}
                      >
                        ⭐ Browse 6 Strategy Templates
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 4. Sub-View Body: STRATEGY TEMPLATES */}
            {basketSubView === "templates" && (
              <div className="basket-templates-section">
                <div className="templates-header-banner">
                  <div>
                    <h4 className="templates-banner-title">Institutional Multi-Leg Strategy Templates</h4>
                    <p className="templates-banner-sub">
                      One-click deployment of pre-balanced sector rotations, core wealth pillars, and hedge baskets.
                    </p>
                  </div>
                </div>

                <div className="basket-templates-grid">
                  {basketTemplates.map((tmpl) => (
                    <div className="template-card" key={tmpl.code}>
                      <div className="template-card-header">
                        <div>
                          <div className="template-meta-row">
                            <span className="template-category-badge">{tmpl.category}</span>
                            <span className="template-tag-badge">{tmpl.tag}</span>
                          </div>
                          <h4 className="template-title">{tmpl.name}</h4>
                        </div>
                      </div>

                      <p className="template-desc">{tmpl.description}</p>

                      <div className="template-constituents-box">
                        <span className="constituents-header">Constituent Legs ({tmpl.items?.length || 0}):</span>
                        <div className="template-legs-list">
                          {tmpl.items?.map((it, idx) => (
                            <div className="template-leg-row" key={idx}>
                              <span className="leg-sym-badge">{it.symbol}</span>
                              <span className="leg-name-text">{it.name || it.symbol}</span>
                              <span className="leg-qty-price">
                                {it.qty} × ₹{Number(it.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="template-card-footer">
                        <div className="template-margin-col">
                          <span className="template-margin-label">Est. Capital / Margin</span>
                          <strong className="template-margin-num">
                            ₹{Number(tmpl.marginRequired).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className="btn-add-template"
                          disabled={addingTemplateCode === tmpl.code}
                          onClick={() => handleAddTemplateToBaskets(tmpl)}
                        >
                          {addingTemplateCode === tmpl.code ? (
                            <>
                              <span className="template-spinner"></span>
                              <span>Adding to Baskets...</span>
                            </>
                          ) : (
                            <span>+ Add to My Baskets</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SIP ================= */}
        {activeTab === "sip" && (
          <div className="tab-pane-content">
            {/* Sub-view Navigation Bar */}
            <div className="sip-subview-header">
              <div className="sip-subview-pills">
                <button
                  type="button"
                  className={`sip-view-pill ${sipView === "explore" ? "active" : ""}`}
                  onClick={() => setSipView("explore")}
                >
                  ⭐ Explore 50 Real Market SIPs
                  <span className="pill-badge-count">{marketSipsCatalog.length || 50}</span>
                </button>
                <button
                  type="button"
                  className={`sip-view-pill ${sipView === "active" ? "active" : ""}`}
                  onClick={() => setSipView("active")}
                >
                  My Active SIPs
                  <span className="pill-badge-count">{sips.length}</span>
                </button>
              </div>

              <div className="sip-subview-actions">
                <button
                  type="button"
                  className="btn-kite-secondary"
                  onClick={() => navigate("/holdings", { state: { defaultSubTab: "mf" } })}
                  style={{ marginRight: "10px", fontSize: "12px", padding: "6px 12px" }}
                  title="View active Coin SIP portfolios and Demat holdings"
                >
                  View Coin Demat Holdings ↗
                </button>
                <button
                  className="btn-kite-primary"
                  onClick={() => {
                    setSelectedMarketCodeForModal(null);
                    setIsSipModalOpen(true);
                  }}
                >
                  + New SIP
                </button>
              </div>
            </div>

            {/* VIEW 1: Explore 50 Real Market SIPs */}
            {sipView === "explore" && (
              <div className="sip-explore-container">
                <div className="sip-catalog-toolbar">
                  <div className="catalog-category-filters">
                    <button
                      type="button"
                      className={`cat-filter-btn ${marketCategoryFilter === "ALL" ? "active" : ""}`}
                      onClick={() => setMarketCategoryFilter("ALL")}
                    >
                      All (50)
                    </button>
                    <button
                      type="button"
                      className={`cat-filter-btn ${marketCategoryFilter === "STOCK" ? "active" : ""}`}
                      onClick={() => setMarketCategoryFilter("STOCK")}
                    >
                      Bluechip Stocks (25)
                    </button>
                    <button
                      type="button"
                      className={`cat-filter-btn ${marketCategoryFilter === "ETF" ? "active" : ""}`}
                      onClick={() => setMarketCategoryFilter("ETF")}
                    >
                      ETFs & Indices (15)
                    </button>
                    <button
                      type="button"
                      className={`cat-filter-btn ${marketCategoryFilter === "THEMATIC" ? "active" : ""}`}
                      onClick={() => setMarketCategoryFilter("THEMATIC")}
                    >
                      Thematic Wealth (10)
                    </button>
                  </div>

                  <div className="catalog-search-box">
                    <input
                      type="text"
                      placeholder="Search 50 SIPs by stock, ETF, theme..."
                      value={sipSearchTerm}
                      onChange={(e) => setSipSearchTerm(e.target.value)}
                      className="catalog-search-input"
                    />
                  </div>
                </div>

                <div className="kite-table-container sip-market-table-scroll">
                  <table className="kite-data-table market-sips-table">
                    <thead>
                      <tr>
                        <th style={{ width: "32%" }}>SIP Strategy & Asset</th>
                        <th style={{ width: "16%" }}>Category & Theme</th>
                        <th style={{ width: "13%" }}>Min. Installment</th>
                        <th style={{ width: "11%" }}>3Y CAGR</th>
                        <th style={{ width: "10%" }}>Risk</th>
                        <th style={{ width: "18%" }}>Underlying Assets</th>
                        <th style={{ width: "10%", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarketSips.map((plan) => (
                        <tr key={plan.code} className="market-sip-row">
                          {/* 1. Strategy & Asset */}
                          <td>
                            <div className="sip-strategy-cell">
                              <div className="sip-strategy-title-row">
                                <span className="sip-ticker-pill">
                                  {plan.symbol || plan.code.replace("SIP_", "")}
                                </span>
                                <span className="sip-strategy-title">{plan.name}</span>
                              </div>
                              <p className="sip-strategy-desc-text">{plan.description}</p>
                            </div>
                          </td>

                          {/* 2. Category & Theme */}
                          <td>
                            <div className="sip-category-stacked-cell">
                              <span
                                className={`sip-category-chip cat-${(plan.category || "")
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, "-")}`}
                              >
                                {plan.category}
                              </span>
                              <span className="sip-theme-subtext">{plan.tag}</span>
                            </div>
                          </td>

                          {/* 3. Min Installment */}
                          <td>
                            <div className="sip-min-amount-cell">
                              <span className="sip-amount-val">
                                ₹{Number(plan.minAmount).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <span className="sip-amount-freq">per installment</span>
                            </div>
                          </td>

                          {/* 4. 3Y CAGR */}
                          <td>
                            <div className="sip-cagr-badge">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                              </svg>
                              <span>{plan.cagr3Yr}</span>
                            </div>
                          </td>

                          {/* 5. Risk Rating */}
                          <td>
                            <span
                              className={`sip-risk-pill risk-${(plan.risk || "").toLowerCase()}`}
                            >
                              {plan.risk}
                            </span>
                          </td>

                          {/* 6. Underlying Assets */}
                          <td>
                            <div className="sip-assets-flow">
                              {plan.instruments?.map((inst, idx) => (
                                <span key={idx} className="sip-asset-chip">
                                  <span className="chip-qty">{inst.qty}×</span>
                                  <span className="chip-symbol">{inst.symbol}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 7. Action Button */}
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-start-market-sip"
                              onClick={() => {
                                setSelectedMarketCodeForModal(plan.code);
                                setIsSipModalOpen(true);
                              }}
                            >
                              + Start SIP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 2: My Active SIPs */}
            {sipView === "active" && (
              <div className="sip-active-container">
                <div className="sip-action-bar">
                  <input
                    type="text"
                    placeholder="Search active SIPs by name, symbol..."
                    value={sipSearchTerm}
                    onChange={(e) => setSipSearchTerm(e.target.value)}
                    className="sip-search-input"
                  />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    Showing <strong>{filteredSips.length}</strong> active schedules
                  </span>
                </div>

                {sipsLoading ? (
                  <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading your SIP schedules...
                  </div>
                ) : filteredSips.length > 0 ? (
                  <div className="kite-table-container active-sips-table-scroll">
                    <table className="kite-data-table active-sips-table">
                      <thead>
                        <tr>
                          <th style={{ width: "26%" }}>SIP Strategy</th>
                          <th style={{ width: "14%" }}>Linked Asset / Plan</th>
                          <th style={{ width: "16%" }}>Schedule</th>
                          <th style={{ width: "13%" }}>Next Trigger</th>
                          <th style={{ width: "13%" }}>Invested (Runs)</th>
                          <th style={{ width: "8%" }}>Status</th>
                          <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSips.map((sip) => {
                          const nextTrigger = new Date(sip.nextTriggerAt);
                          const formattedNext = nextTrigger.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });
                          const formattedTime = sip.scheduleTime || "09:30";
                          const isExecutedToday = Boolean(
                            sip.lastExecutedAt &&
                            new Date(sip.lastExecutedAt).toDateString() === new Date().toDateString()
                          );

                          return (
                            <tr key={sip._id} className="active-sip-row">
                              {/* 1. SIP Name */}
                              <td>
                                <div className="active-sip-name-cell">
                                  <strong className="active-sip-name-title">{sip.name}</strong>
                                </div>
                              </td>

                              {/* 2. Linked Asset / Plan */}
                              <td>
                                <div className="active-sip-asset-cell">
                                  <span className="active-sip-symbol-pill">
                                    {sip.symbol || sip.basketName || "DIRECT"}
                                  </span>
                                  <span className="active-sip-type-tag">
                                    {sip.sipType || (sip.basketName ? "Basket SIP" : "Direct Stock SIP")}
                                  </span>
                                </div>
                              </td>

                              {/* 3. Schedule */}
                              <td>
                                <div className="active-sip-schedule-cell">
                                  <span className="active-schedule-badge">
                                    {sip.frequency === "MONTHLY" ? "Monthly" : sip.frequency === "WEEKLY" ? "Weekly" : "Daily"}
                                  </span>
                                  <span className="active-schedule-detail">
                                    {sip.frequency === "MONTHLY"
                                      ? `${sip.scheduleDay}${sip.scheduleDay === 1 ? "st" : sip.scheduleDay === 2 ? "nd" : sip.scheduleDay === 3 ? "rd" : "th"} of month @ ${formattedTime}`
                                      : sip.frequency === "WEEKLY"
                                      ? `Every ${WEEK_DAY_NAMES[sip.scheduleDay] || `Day ${sip.scheduleDay}`} @ ${formattedTime}`
                                      : `Every Trading Day @ ${formattedTime}`}
                                  </span>
                                </div>
                              </td>

                              {/* 4. Next Trigger */}
                              <td>
                                <div className="active-sip-trigger-cell">
                                  <span className="trigger-date">{formattedNext}</span>
                                  <span className="trigger-time">{formattedTime} IST</span>
                                </div>
                              </td>

                              {/* 5. Invested (Runs) */}
                              <td>
                                <div className="active-sip-invested-cell">
                                  <span className="invested-amount">
                                    ₹{Number(sip.totalCapitalInvested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="invested-runs-pill">
                                    {sip.totalInstallmentsExecuted || 0} runs executed
                                  </span>
                                </div>
                              </td>

                              {/* 6. Status */}
                              <td>
                                <span
                                  className={`active-sip-status-badge ${
                                    sip.status === "ACTIVE" ? "active" : "paused"
                                  }`}
                                >
                                  <span className="status-dot"></span>
                                  {sip.status}
                                </span>
                              </td>

                              {/* 7. Actions */}
                              <td style={{ textAlign: "right", position: "relative" }}>
                                <div className="sip-actions-menu-container">
                                  <button
                                    type="button"
                                    className={`btn-sip-actions-dropdown ${openMenuSipId === sip._id ? "active" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuSipId(openMenuSipId === sip._id ? null : sip._id);
                                    }}
                                  >
                                    <span>Actions</span>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </button>

                                  {openMenuSipId === sip._id && (
                                    <div className="sip-actions-popover" onClick={(e) => e.stopPropagation()}>
                                      {/* 1. Execute Option */}
                                      <button
                                        type="button"
                                        className="sip-popover-item"
                                        onClick={() => {
                                          setOpenMenuSipId(null);
                                          handleExecuteSipNow(sip);
                                        }}
                                      >
                                        <div className="popover-item-icon-wrapper blue">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                          </svg>
                                        </div>
                                        <div className="popover-item-content">
                                          <div className="popover-item-title-row">
                                            <span className="popover-item-title">
                                              {isExecutedToday ? "Advance Installment" : "Execute Installment"}
                                            </span>
                                            {isExecutedToday && <span className="popover-item-badge">Done Today</span>}
                                          </div>
                                          <span className="popover-item-sub">
                                            {isExecutedToday ? `Pre-order for ${formattedNext}` : "Place market CNC order now"}
                                          </span>
                                        </div>
                                      </button>

                                      {/* 2. Pause / Resume Option */}
                                      <button
                                        type="button"
                                        className="sip-popover-item"
                                        onClick={() => {
                                          setOpenMenuSipId(null);
                                          handleToggleSipStatus(sip);
                                        }}
                                      >
                                        <div className="popover-item-icon-wrapper gray">
                                          {sip.status === "ACTIVE" ? (
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                              <rect x="6" y="4" width="4" height="16"></rect>
                                              <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                          ) : (
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                          )}
                                        </div>
                                        <div className="popover-item-content">
                                          <span className="popover-item-title">
                                            {sip.status === "ACTIVE" ? "Pause Schedule" : "Resume Schedule"}
                                          </span>
                                          <span className="popover-item-sub">
                                            {sip.status === "ACTIVE" ? "Temporarily halt auto-triggers" : "Re-activate automated execution"}
                                          </span>
                                        </div>
                                      </button>

                                      <div className="sip-popover-divider"></div>

                                      {/* 3. Cancel / Delete Option */}
                                      <button
                                        type="button"
                                        className="sip-popover-item danger"
                                        onClick={() => {
                                          setOpenMenuSipId(null);
                                          handleDeleteSip(sip);
                                        }}
                                      >
                                        <div className="popover-item-icon-wrapper red">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                          </svg>
                                        </div>
                                        <div className="popover-item-content">
                                          <span className="popover-item-title">Cancel SIP Mandate</span>
                                          <span className="popover-item-sub">Permanently delete schedule</span>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : sips.length === 0 ? (
                  <div className="empty-state-view">
                    <div className="empty-state-illustration">
                      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <h4 className="empty-state-title">No active stock SIP schedules</h4>
                    <p className="empty-state-subtitle">
                      Explore 50 verified market SIPs to start systematic investing with 1 click.
                    </p>
                    <button
                      className="btn-kite-primary"
                      onClick={() => setSipView("explore")}
                    >
                      ⭐ Explore 50 Real Market SIPs
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    No SIPs found matching "{sipSearchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: ALERTS ================= */}
        {activeTab === "alerts" && (
          <div className="alerts-container">
            {/* Top Action Bar: Filter Pills, Search Bar, and New Alert Button */}
            <div className="alerts-top-bar">
              <div className="alerts-filter-pills">
                <button
                  type="button"
                  className={`alert-filter-pill ${alertFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setAlertFilter("ALL")}
                >
                  All <span>({alerts.length})</span>
                </button>
                <button
                  type="button"
                  className={`alert-filter-pill ${alertFilter === "ACTIVE" ? "active" : ""}`}
                  onClick={() => setAlertFilter("ACTIVE")}
                >
                  Active <span>({alerts.filter((a) => a.status === "ACTIVE").length})</span>
                </button>
                <button
                  type="button"
                  className={`alert-filter-pill ${alertFilter === "TRIGGERED" ? "active" : ""}`}
                  onClick={() => setAlertFilter("TRIGGERED")}
                >
                  Triggered <span>({alerts.filter((a) => a.status === "TRIGGERED").length})</span>
                </button>
                <button
                  type="button"
                  className={`alert-filter-pill ${alertFilter === "DISABLED" ? "active" : ""}`}
                  onClick={() => setAlertFilter("DISABLED")}
                >
                  Disabled <span>({alerts.filter((a) => a.status === "DISABLED").length})</span>
                </button>
              </div>

              <div className="alerts-actions-right">
                <input
                  type="text"
                  placeholder="Search alerts by symbol, note..."
                  value={alertSearchTerm}
                  onChange={(e) => setAlertSearchTerm(e.target.value)}
                  className="alerts-search-input"
                />
                <button
                  type="button"
                  className="btn-new-alert"
                  onClick={() => {
                    setEditingAlert(null);
                    setIsAlertModalOpen(true);
                  }}
                >
                  + Set Price Alert
                </button>
              </div>
            </div>

            {alertsLoading ? (
              <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Loading your Sentinel price alerts...
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div className="kite-table-container alerts-table-scroll">
                <table className="kite-data-table alerts-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Instrument</th>
                      <th style={{ width: "18%" }}>Condition Rule</th>
                      <th style={{ width: "13%" }}>Live LTP</th>
                      <th style={{ width: "16%" }}>Distance / Status Date</th>
                      <th style={{ width: "10%" }}>Status</th>
                      <th style={{ width: "9%" }}>Memo</th>
                      <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => {
                      const isGte = alert.conditionType === "GTE";
                      const isLte = alert.conditionType === "LTE";
                      const isPctUp = alert.conditionType === "PCT_UP";

                      const conditionText = isGte
                        ? `LTP ≥ ₹${Number(alert.targetPrice || 0).toLocaleString("en-IN")}`
                        : isLte
                        ? `LTP ≤ ₹${Number(alert.targetPrice || 0).toLocaleString("en-IN")}`
                        : isPctUp
                        ? `Gain ≥ +${alert.targetPercentage}%`
                        : `Dip ≤ -${alert.targetPercentage}%`;

                      return (
                        <tr key={alert._id} className="alert-row">
                          {/* 1. Instrument */}
                          <td>
                            <div className="alert-stock-cell">
                              <div className="stock-badges-row">
                                <span className="alert-sym-tag">{alert.symbol}</span>
                                <span className="alert-ex-tag">{alert.exchange || "NSE"}</span>
                              </div>
                              <span className="alert-stock-title">{alert.name || alert.symbol}</span>
                            </div>
                          </td>

                          {/* 2. Condition Rule */}
                          <td>
                            <div className="alert-condition-cell">
                              <span className={`condition-rule-pill ${isGte || isPctUp ? "bull" : "bear"}`}>
                                {conditionText}
                              </span>
                            </div>
                          </td>

                          {/* 3. Live LTP */}
                          <td>
                            <div className="alert-ltp-cell">
                              <strong className="alert-ltp-price">
                                ₹{Number(alert.currentLtp || alert.targetPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </td>

                          {/* 4. Distance / Triggered At */}
                          <td>
                            <div className="alert-distance-cell">
                              {alert.status === "TRIGGERED" ? (
                                <span className="triggered-time-badge">
                                  🚨 Triggered {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently"} @ ₹{alert.triggeredPrice || alert.currentLtp}
                                </span>
                              ) : (
                                <span className={`distance-proximity-pill ${alert.distancePct <= 2 ? "near" : ""}`}>
                                  {alert.distancePct !== undefined ? `${alert.distancePct > 0 ? "+" : ""}${alert.distancePct}% to target` : "In range"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Status */}
                          <td>
                            <span className={`alert-status-badge status-${(alert.status || "").toLowerCase()}`}>
                              <span className="alert-status-dot"></span>
                              {alert.status}
                            </span>
                          </td>

                          {/* 6. Notes */}
                          <td>
                            <span className="alert-memo-text" title={alert.notes}>
                              {alert.notes || "—"}
                            </span>
                          </td>

                          {/* 7. Actions Menu */}
                          <td style={{ textAlign: "right", position: "relative" }}>
                            <div className="alert-actions-menu-container">
                              <button
                                type="button"
                                className={`btn-alert-actions-dropdown ${openAlertMenuId === alert._id ? "active" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenAlertMenuId(openAlertMenuId === alert._id ? null : alert._id);
                                }}
                              >
                                <span>Actions</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>

                              {openAlertMenuId === alert._id && (
                                <div className="alert-actions-popover" onClick={(e) => e.stopPropagation()}>
                                  {/* Reset Option (if TRIGGERED) */}
                                  {alert.status === "TRIGGERED" && (
                                    <button
                                      type="button"
                                      className="alert-popover-item primary"
                                      onClick={() => {
                                        setOpenAlertMenuId(null);
                                        handleResetAlert(alert);
                                      }}
                                    >
                                      <span className="popover-icon green">⚡</span>
                                      <div className="popover-texts">
                                        <span className="popover-title">Re-Arm Alert (Reset)</span>
                                        <span className="popover-sub">Resume active price monitoring</span>
                                      </div>
                                    </button>
                                  )}

                                  {/* Edit Option */}
                                  <button
                                    type="button"
                                    className="alert-popover-item"
                                    onClick={() => {
                                      setOpenAlertMenuId(null);
                                      setEditingAlert(alert);
                                      setIsAlertModalOpen(true);
                                    }}
                                  >
                                    <span className="popover-icon gray">✏️</span>
                                    <div className="popover-texts">
                                      <span className="popover-title">Edit Alert</span>
                                      <span className="popover-sub">Change target price or rule</span>
                                    </div>
                                  </button>

                                  {/* Pause / Resume */}
                                  <button
                                    type="button"
                                    className="alert-popover-item"
                                    onClick={() => {
                                      setOpenAlertMenuId(null);
                                      handleToggleAlertStatus(alert);
                                    }}
                                  >
                                    <span className="popover-icon gray">
                                      {alert.status === "ACTIVE" ? "⏸" : "▶"}
                                    </span>
                                    <div className="popover-texts">
                                      <span className="popover-title">
                                        {alert.status === "ACTIVE" ? "Pause Alert" : "Enable Alert"}
                                      </span>
                                      <span className="popover-sub">
                                        {alert.status === "ACTIVE" ? "Temporarily halt checks" : "Resume Sentinel monitoring"}
                                      </span>
                                    </div>
                                  </button>

                                  <div className="alert-popover-divider"></div>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    className="alert-popover-item danger"
                                    onClick={() => {
                                      setOpenAlertMenuId(null);
                                      setAlertToDelete(alert);
                                    }}
                                  >
                                    <span className="popover-icon red">🗑</span>
                                    <div className="popover-texts">
                                      <span className="popover-title">Delete Alert</span>
                                      <span className="popover-sub">Remove from Sentinel</span>
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : alerts.length === 0 ? (
              <div className="empty-state-view">
                <div className="empty-state-illustration">
                  <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <h4 className="empty-state-title">No price alerts created</h4>
                <p className="empty-state-subtitle">
                  Get notified immediately via In-App notifications and email when stock prices cross your defined boundaries.
                </p>
                <button
                  type="button"
                  className="btn-kite-primary"
                  onClick={() => {
                    setEditingAlert(null);
                    setIsAlertModalOpen(true);
                  }}
                >
                  + Set Price Alert
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                No alerts match the selected filter &quot;{alertFilter}&quot;.
              </div>
            )}
          </div>
        )}
      </div>
    
      {isSipModalOpen && (
        <SipCreateModal
          onClose={() => {
            setIsSipModalOpen(false);
            setSelectedMarketCodeForModal(null);
          }}
          onSipCreated={() => {
            fetchSips();
            setSipView("active");
          }}
          preselectedMarketCode={selectedMarketCodeForModal}
        />
      )}

      {sipToExecute && (
        <SipExecuteModal
          isOpen={!!sipToExecute}
          sip={sipToExecute}
          onClose={() => setSipToExecute(null)}
          onConfirm={handleConfirmExecuteSip}
          isExecuting={executingSipId === sipToExecute._id}
          availableMargin={userAvailableMargin}
        />
      )}

      {sipToDelete && (
        <SipDeleteModal
          isOpen={!!sipToDelete}
          sip={sipToDelete}
          onClose={() => setSipToDelete(null)}
          onConfirm={handleConfirmDeleteSip}
          isDeleting={isDeletingSip}
        />
      )}

      {isAlertModalOpen && (
        <AlertCreateModal
          isOpen={isAlertModalOpen}
          onClose={() => {
            setIsAlertModalOpen(false);
            setEditingAlert(null);
          }}
          onAlertSaved={(title, msg) => {
            showToast(title, msg, "success");
            fetchAlerts();
          }}
          editAlert={editingAlert}
          activeUserId={currentUser?.userId}
        />
      )}

      {alertToDelete && (
        <AlertDeleteModal
          isOpen={!!alertToDelete}
          alert={alertToDelete}
          onClose={() => setAlertToDelete(null)}
          onConfirm={handleConfirmDeleteAlert}
          isDeleting={isDeletingAlert}
        />
      )}

      {basketToExecute && (
        <BasketExecuteModal
          isOpen={Boolean(basketToExecute)}
          basket={basketToExecute}
          onClose={() => setBasketToExecute(null)}
          onConfirm={handleConfirmExecuteBasket}
          isExecuting={isExecutingBasket}
          availableMargin={userAvailableMargin}
        />
      )}

      {basketToDelete && (
        <BasketDeleteModal
          isOpen={Boolean(basketToDelete)}
          basket={basketToDelete}
          onClose={() => setBasketToDelete(null)}
          onConfirm={handleConfirmDeleteBasket}
          isDeleting={isDeletingBasket}
        />
      )}
</div>
  );
};

export default Orders;
