import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import { useMarketFeed } from "../context/MarketFeedContext";
import { Tooltip, Grow } from "@mui/material";
import { Add, Check } from "@mui/icons-material";

const WatchlistSearchDropdown = ({
  searchTerm,
  onClose,
  activeTabId,
  activeTabName,
  currentStocks,
  onStockAdded,
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState(null);
  const generalContext = useContext(GeneralContext);
  const { registerStocks, quotes } = useMarketFeed();

  const userId = generalContext.currentUser?.userId;

  // Set of symbols already in current tab
  const currentSymbolSet = new Set((currentStocks || []).map((s) => (s.symbol || "").toUpperCase()));

  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const cancelTokenSource = axios.CancelToken.source();

    const timer = setTimeout(() => {
      axios
        .get(`http://localhost:3002/masterInstruments?q=${encodeURIComponent(searchTerm.trim())}`, {
          cancelToken: cancelTokenSource.token,
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setResults(res.data);
          }
          setLoading(false);
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            console.error("Master instruments search error:", err);
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      cancelTokenSource.cancel();
    };
  }, [searchTerm]);

  const handleAddStock = async (e, stock) => {
    e.stopPropagation();
    if (currentSymbolSet.has(stock.symbol.toUpperCase())) return;

    if (currentStocks.length >= 50) {
      generalContext.showToast("Limit Reached", "Max 50 instruments per watchlist.", "error");
      return;
    }

    setAddingSymbol(stock.symbol);
    try {
      const res = await axios.post("http://localhost:3002/addWatchlistStock", {
        userId,
        tabId: activeTabId,
        stock,
      });

      if (res.data.success) {
        // Register in market feed so it begins live simulated ticks
        registerStocks([stock]);
        onStockAdded(stock);
        generalContext.showToast("Stock Added", `Added ${stock.symbol} to ${activeTabName}`, "success");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add stock to watchlist";
      generalContext.showToast("Error", msg, "error");
    } finally {
      setAddingSymbol(null);
    }
  };

  const handleBuy = (e, stock) => {
    e.stopPropagation();
    const livePrice = quotes[stock.symbol]?.price || stock.price;
    generalContext.openBuyWindow(stock.symbol, "BUY", livePrice);
  };

  const handleSell = (e, stock) => {
    e.stopPropagation();
    const livePrice = quotes[stock.symbol]?.price || stock.price;
    generalContext.openBuyWindow(stock.symbol, "SELL", livePrice);
  };

  if (!searchTerm.trim()) return null;

  return (
    <div className="watchlist-search-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="search-dropdown-header">
        <span className="header-title">Instruments ({results.length})</span>
        <span className="header-tab-indicator">Adding to: <strong>{activeTabName}</strong></span>
      </div>

      <div className="search-dropdown-scroll">
        {loading && (
          <div className="search-dropdown-loading">
            <span className="spinner-dots">Searching instrument universe...</span>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="search-dropdown-empty">
            <p>No instruments match "<strong>{searchTerm}</strong>"</p>
            <span className="search-hint">Try searching for: Reliance, Tata, HDFC, Infy, Nifty, BeES...</span>
          </div>
        )}

        {!loading && results.map((item) => {
          const isAdded = currentSymbolSet.has(item.symbol.toUpperCase());
          const isAdding = addingSymbol === item.symbol;
          const live = quotes[item.symbol];
          const displayPrice = live ? live.price : item.price;
          const displayPercent = live ? live.percent : item.percent;
          const displayIsDown = live ? live.isDown : item.isDown;

          return (
            <div key={item.symbol} className="search-dropdown-row">
              <div className="item-info">
                <div className="symbol-line">
                  <span className="stock-sym">{item.symbol}</span>
                  <span className="exchange-pill">{item.exchange || "NSE"}</span>
                  {item.sector && <span className="sector-pill">{item.sector}</span>}
                </div>
                <div className="name-line">{item.name}</div>
              </div>

              <div className="item-price-col">
                <span className={`price-val ${displayIsDown ? "text-down" : "text-up"}`}>
                  ₹{Number(displayPrice).toFixed(2)}
                </span>
                <span className={`pct-val ${displayIsDown ? "text-down" : "text-up"}`}>
                  {displayPercent}
                </span>
              </div>

              <div className="item-actions">
                <Tooltip title="Buy" arrow TransitionComponent={Grow}>
                  <button className="mini-action-btn buy" onClick={(e) => handleBuy(e, item)}>
                    B
                  </button>
                </Tooltip>
                <Tooltip title="Sell" arrow TransitionComponent={Grow}>
                  <button className="mini-action-btn sell" onClick={(e) => handleSell(e, item)}>
                    S
                  </button>
                </Tooltip>

                {isAdded ? (
                  <span className="badge-already-added" title="Already in this watchlist">
                    <Check fontSize="inherit" /> Added
                  </span>
                ) : (
                  <button
                    className={`btn-add-stock ${isAdding ? "loading" : ""}`}
                    onClick={(e) => handleAddStock(e, item)}
                    disabled={isAdding}
                  >
                    <Add fontSize="inherit" /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistSearchDropdown;
