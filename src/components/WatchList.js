import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { initialWatchlist, watchlistGroups } from "../data/mockData";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
  SettingsOutlined,
  SearchOutlined,
} from "@mui/icons-material";

const WatchList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { activeWatchlistGroup, setActiveWatchlistGroup } = useContext(GeneralContext);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3002/allWatchlist")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setWatchlist(res.data);
        } else {
          setWatchlist(initialWatchlist);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable for watchlist, using fallback:", err.message);
        setWatchlist(initialWatchlist);
      });
  }, []);

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return watchlist;
    return watchlist.filter(
      (item) =>
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [watchlist, searchTerm]);

  return (
    <aside className="watchlist-container">
      {/* Search Bar */}
      <div className="watchlist-search-wrap">
        <SearchOutlined className="search-icon" />
        <input
          type="text"
          name="search"
          placeholder="Search eg: infy, bse, nifty fut weekly, gold mcx"
          className="watchlist-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="watchlist-count">{filteredList.length} / 50</span>
      </div>

      {/* Instruments List */}
      <div className="watchlist-scroll-area">
        <ul className="watchlist-items-list">
          {filteredList.map((stock) => (
            <WatchListItem
              stock={stock}
              key={stock.symbol}
              onRemove={(sym) => setWatchlist((prev) => prev.filter((s) => s.symbol !== sym))}
            />
          ))}
          {filteredList.length === 0 && (
            <li className="watchlist-no-results">
              No instruments found for "{searchTerm}"
            </li>
          )}
        </ul>
      </div>

      {/* Bottom Watchlist Groups Pagination */}
      <div className="watchlist-pagination-bar">
        <ul className="watchlist-tabs">
          {watchlistGroups.map((group) => (
            <li
              key={group.id}
              className={`watchlist-tab-item ${activeWatchlistGroup === group.id ? "active" : ""}`}
              onClick={() => setActiveWatchlistGroup(group.id)}
            >
              {group.id}
            </li>
          ))}
        </ul>
        <button
          className="watchlist-settings-btn"
          title="Watchlist settings"
          onClick={() => alert("Watchlist settings configuration")}
          aria-label="Settings"
        >
          <SettingsOutlined fontSize="small" />
        </button>
      </div>
    </aside>
  );
};

export default WatchList;

const WatchListItem = ({ stock, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      className={`watchlist-row ${isHovered ? "hovered" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="row-left">
        <span className={`stock-symbol ${stock.isDown ? "text-down" : "text-up"}`}>
          {stock.symbol}
        </span>
        <span className="stock-exchange">{stock.exchange}</span>
      </div>

      <div className="row-right">
        <span className="stock-percent">{stock.percent}</span>
        {stock.isDown ? (
          <KeyboardArrowDown className="arrow-down" fontSize="small" />
        ) : (
          <KeyboardArrowUp className="arrow-up" fontSize="small" />
        )}
        <span className={`stock-price ${stock.isDown ? "text-down" : "text-up"}`}>
          {Number(stock.price || 0).toFixed(2)}
        </span>
      </div>

      {isHovered && <WatchListActions uid={stock.symbol} onRemove={onRemove} />}
    </li>
  );
};

const WatchListActions = ({ uid, onRemove }) => {
  const generalContext = useContext(GeneralContext);

  const handleBuyClick = (e) => {
    e.stopPropagation();
    generalContext.openBuyWindow(uid);
  };

  const handleSellClick = (e) => {
    e.stopPropagation();
    generalContext.openBuyWindow(uid);
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
        <button className="action-btn icon-btn" onClick={(e) => e.stopPropagation()}>
          <MoreHoriz fontSize="inherit" />
        </button>
      </Tooltip>
      <Tooltip title="Chart (C)" placement="top" arrow TransitionComponent={Grow}>
        <button className="action-btn icon-btn" onClick={(e) => e.stopPropagation()}>
          <BarChartOutlined fontSize="inherit" />
        </button>
      </Tooltip>
      <Tooltip title="Delete (Del)" placement="top" arrow TransitionComponent={Grow}>
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
