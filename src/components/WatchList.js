import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { useMarketFeed } from "../context/MarketFeedContext";
import WatchlistSearchDropdown from "./WatchlistSearchDropdown";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
  SearchOutlined,
  Close,
  EditOutlined,
  FolderOpenOutlined,
} from "@mui/icons-material";

const WatchList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { activeWatchlistGroup, setActiveWatchlistGroup, showToast, currentUser } = useContext(GeneralContext);
  const { quotes, registerStocks } = useMarketFeed();

  const [tabs, setTabs] = useState([
    { tabId: 1, tabName: "Watchlist 1", count: 15 },
    { tabId: 2, tabName: "Watchlist 2", count: 0 },
    { tabId: 3, tabName: "Watchlist 3", count: 0 },
    { tabId: 4, tabName: "Watchlist 4", count: 0 },
    { tabId: 5, tabName: "Watchlist 5", count: 0 },
    { tabId: 6, tabName: "Watchlist 6", count: 0 },
    { tabId: 7, tabName: "Watchlist 7", count: 0 },
  ]);

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Editing tab name state
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const editInputRef = useRef(null);

  const searchContainerRef = useRef(null);
  const userId = currentUser?.userId || "ZU9344";

  // 1. Fetch user's 7 tabs metadata
  const fetchTabs = useCallback(() => {
    axios
      .get(`http://localhost:3002/userWatchlistTabs?userId=${userId}`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTabs(res.data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load user watchlist tabs, retrying:", err.message);
        setTimeout(() => {
          axios
            .get(`http://localhost:3002/userWatchlistTabs?userId=${userId}`)
            .then((res) => {
              if (Array.isArray(res.data) && res.data.length > 0) {
                setTabs(res.data);
              }
            })
            .catch(() => {});
        }, 1500);
      });
  }, [userId]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  // 2. Fetch stocks for the active tab (with resilient auto-retry if backend is reconnecting)
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const fetchStocks = (retryCount = 0) => {
      setLoading(true);
      axios
        .get(`http://localhost:3002/userWatchlist?userId=${userId}&tabId=${activeWatchlistGroup}`)
        .then((res) => {
          if (!isMounted) return;
          const stocks = res.data?.stocks || [];
          setWatchlist(stocks);
          // Register any loaded stocks into market feed ticker
          if (stocks.length > 0) {
            registerStocks(stocks);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.warn("Error fetching tab stocks:", err.message);
          if (!isMounted) return;
          // Auto-retry if backend was briefly restarting
          if (retryCount < 3) {
            retryTimer = setTimeout(() => {
              if (isMounted) fetchStocks(retryCount + 1);
            }, 1000 * (retryCount + 1));
          } else {
            setLoading(false);
          }
        });
    };

    fetchStocks();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [userId, activeWatchlistGroup, registerStocks]);

  // Close search dropdown on click outside or Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Merge with live feed ticks
  const mergedList = useMemo(() => {
    return watchlist.map((item) => {
      const live = quotes[item.symbol];
      if (live) {
        return {
          ...item,
          price: live.price,
          change: live.change,
          percent: live.percent,
          isDown: live.isDown,
          tickDirection: live.tickDirection,
        };
      }
      return item;
    });
  }, [watchlist, quotes]);

  const activeTabObj = tabs.find((t) => t.tabId === activeWatchlistGroup) || {
    tabId: activeWatchlistGroup,
    tabName: `Watchlist ${activeWatchlistGroup}`,
    count: mergedList.length,
  };

  // Add stock handler
  const handleStockAdded = (stock) => {
    setWatchlist((prev) => {
      if (prev.some((s) => s.symbol === stock.symbol)) return prev;
      return [...prev, stock];
    });
    setTabs((prev) =>
      prev.map((t) => (t.tabId === activeWatchlistGroup ? { ...t, count: t.count + 1 } : t))
    );
  };

  // Remove stock handler
  const handleRemoveStock = async (symbol) => {
    try {
      const res = await axios.post("http://localhost:3002/removeWatchlistStock", {
        userId,
        tabId: activeWatchlistGroup,
        symbol,
      });
      if (res.data.success) {
        setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
        setTabs((prev) =>
          prev.map((t) =>
            t.tabId === activeWatchlistGroup ? { ...t, count: Math.max(0, t.count - 1) } : t
          )
        );
        showToast("Removed", `Removed ${symbol} from ${activeTabObj.tabName}`, "info");
      }
    } catch (err) {
      showToast("Error", "Failed to remove stock", "error");
    }
  };

  // Tab renaming
  const handleStartRename = (e, tab) => {
    e.stopPropagation();
    setEditingTabId(tab.tabId);
    setEditingTabName(tab.tabName);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  };

  const handleSaveRename = async () => {
    if (!editingTabId) return;
    const cleanName = editingTabName.trim();
    if (!cleanName) {
      setEditingTabId(null);
      return;
    }

    try {
      const res = await axios.post("http://localhost:3002/renameWatchlistTab", {
        userId,
        tabId: editingTabId,
        tabName: cleanName,
      });
      if (res.data.success) {
        setTabs((prev) =>
          prev.map((t) => (t.tabId === editingTabId ? { ...t, tabName: cleanName } : t))
        );
        showToast("Renamed", `Watchlist tab renamed to "${cleanName}"`, "success");
      }
    } catch (err) {
      showToast("Error", "Could not rename tab", "error");
    } finally {
      setEditingTabId(null);
    }
  };

  return (
    <aside className="watchlist-container">
      {/* Search Bar with Omnisearch Dropdown */}
      <div className="watchlist-search-wrap" ref={searchContainerRef}>
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          name="search"
          placeholder="Search 100+ stocks (e.g. infy, tata, hdfc, nifty)"
          className="watchlist-search-input"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            if (searchTerm.trim().length > 0) setIsDropdownOpen(true);
          }}
        />

        {searchTerm.trim().length > 0 && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setSearchTerm("");
              setIsDropdownOpen(false);
            }}
            title="Clear search"
          >
            <Close fontSize="small" />
          </button>
        )}

        <span className="watchlist-count">{mergedList.length} / 50</span>

        {/* Dropdown Flyout */}
        {isDropdownOpen && searchTerm.trim().length > 0 && (
          <WatchlistSearchDropdown
            searchTerm={searchTerm}
            onClose={() => setIsDropdownOpen(false)}
            activeTabId={activeWatchlistGroup}
            activeTabName={activeTabObj.tabName}
            currentStocks={watchlist}
            onStockAdded={handleStockAdded}
          />
        )}
      </div>

      {/* Instruments List */}
      <div className="watchlist-scroll-area">
        {loading ? (
          <div className="watchlist-loading-state">
            <span className="spinner-dots">Loading watchlist...</span>
          </div>
        ) : (
          <ul className="watchlist-items-list">
            {mergedList.map((stock) => (
              <WatchListItem
                stock={stock}
                key={stock.symbol}
                onRemove={handleRemoveStock}
              />
            ))}

            {mergedList.length === 0 && (
              <li className="watchlist-empty-tab-state">
                <FolderOpenOutlined className="empty-icon" />
                <h4>This watchlist is empty</h4>
                <p>
                  Use the search bar above to explore our 100+ stock catalog and add instruments to{" "}
                  <strong>{activeTabObj.tabName}</strong>.
                </p>
                <div className="empty-quick-tags">
                  <span onClick={() => { setSearchTerm("TATA"); setIsDropdownOpen(true); }}>+ Tata</span>
                  <span onClick={() => { setSearchTerm("HDFC"); setIsDropdownOpen(true); }}>+ HDFC</span>
                  <span onClick={() => { setSearchTerm("NIFTY"); setIsDropdownOpen(true); }}>+ Nifty</span>
                  <span onClick={() => { setSearchTerm("RELIANCE"); setIsDropdownOpen(true); }}>+ Reliance</span>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Bottom Text Tabs Navigation (Option B) */}
      <div className="watchlist-pagination-bar">
        <div className="watchlist-tabs-scroll-container">
          <ul className="watchlist-tabs">
            {tabs.map((tab) => {
              const isActive = activeWatchlistGroup === tab.tabId;
              const isEditing = editingTabId === tab.tabId;

              return (
                <li
                  key={tab.tabId}
                  className={`watchlist-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (!isEditing) setActiveWatchlistGroup(tab.tabId);
                  }}
                  onDoubleClick={(e) => handleStartRename(e, tab)}
                  title={`Double click to rename (${tab.count} stocks)`}
                >
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      className="tab-rename-input"
                      value={editingTabName}
                      onChange={(e) => setEditingTabName(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename();
                        if (e.key === "Escape") setEditingTabId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="tab-name-text">{tab.tabName}</span>
                      {isActive && (
                        <button
                          className="tab-quick-rename-btn"
                          onClick={(e) => handleStartRename(e, tab)}
                          title="Rename watchlist"
                        >
                          <EditOutlined fontSize="inherit" />
                        </button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default WatchList;

const WatchListItem = ({ stock, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const generalContext = useContext(GeneralContext);

  let flashClass = "";
  if (stock.tickDirection === "up") flashClass = "tick-flash-up";
  else if (stock.tickDirection === "down") flashClass = "tick-flash-down";

  const handleRowClick = () => {
    generalContext.openBuyWindow(stock.symbol, "BUY", stock.price);
  };

  return (
    <li
      className={`watchlist-row ${isHovered ? "hovered" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      <div className="row-left">
        <span className={`stock-symbol ${stock.isDown ? "text-down" : "text-up"}`}>
          {stock.symbol}
        </span>
        <span className="stock-exchange">{stock.exchange || "NSE"}</span>
      </div>

      <div className="row-right">
        <span className="stock-percent">{stock.percent}</span>
        {stock.isDown ? (
          <KeyboardArrowDown className="arrow-down" fontSize="small" />
        ) : (
          <KeyboardArrowUp className="arrow-up" fontSize="small" />
        )}
        <span className={`stock-price ${stock.isDown ? "text-down" : "text-up"} ${flashClass}`}>
          {Number(stock.price || 0).toFixed(2)}
        </span>
      </div>

      {isHovered && <WatchListActions uid={stock.symbol} price={stock.price} onRemove={onRemove} />}
    </li>
  );
};

const WatchListActions = ({ uid, price, onRemove }) => {
  const generalContext = useContext(GeneralContext);
  const navigate = useNavigate();

  const handleBuyClick = (e) => {
    e.stopPropagation();
    generalContext.openBuyWindow(uid, "BUY", price);
  };

  const handleSellClick = (e) => {
    e.stopPropagation();
    generalContext.openBuyWindow(uid, "SELL", price);
  };

  const handleDepthClick = (e) => {
    e.stopPropagation();
    generalContext.openDepthModal(uid);
  };

  const handleChartClick = (e) => {
    e.stopPropagation();
    navigate(`/chart?symbol=${uid}`);
  };

  return (
    <div className="watchlist-actions-overlay">
      <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action-btn buy-btn" onClick={handleBuyClick}>
          B
        </button>
      </Tooltip>
      <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action-btn sell-btn" onClick={handleSellClick}>
          S
        </button>
      </Tooltip>
      <Tooltip title="Market Depth (D)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action-btn icon-btn" onClick={handleDepthClick}>
          <MoreHoriz fontSize="inherit" />
        </button>
      </Tooltip>
      <Tooltip title="Chart (C)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action-btn icon-btn" onClick={handleChartClick}>
          <BarChartOutlined fontSize="inherit" />
        </button>
      </Tooltip>
      <Tooltip title="Delete from watchlist" placement="top" arrow TransitionComponent={Grow}>
        <button
          className="action-btn delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(uid);
          }}
        >
          &times;
        </button>
      </Tooltip>
    </div>
  );
};
