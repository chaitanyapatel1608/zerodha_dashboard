import React, { useContext, useMemo } from "react";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import { initialWatchlist } from "../../data/mockData";

const GainersLosersPanel = () => {
  const { openMarketMovers, openBuyWindow } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();

  // Merge instruments with live tick feed
  const liveList = useMemo(() => {
    return initialWatchlist.map((item) => {
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
  }, [quotes]);

  // Derive Top 5 Gainers
  const topGainers = useMemo(() => {
    const list = [...liveList];
    list.sort((a, b) => {
      const aPct = parseFloat((a.percent || "0").replace(/[%+]/g, "")) || 0;
      const bPct = parseFloat((b.percent || "0").replace(/[%+]/g, "")) || 0;
      const aNet = a.isDown ? -Math.abs(aPct) : Math.abs(aPct);
      const bNet = b.isDown ? -Math.abs(bPct) : Math.abs(bPct);
      return bNet - aNet;
    });
    return list.slice(0, 5);
  }, [liveList]);

  // Derive Top 5 Losers
  const topLosers = useMemo(() => {
    const list = [...liveList];
    list.sort((a, b) => {
      const aPct = parseFloat((a.percent || "0").replace(/[%+]/g, "")) || 0;
      const bPct = parseFloat((b.percent || "0").replace(/[%+]/g, "")) || 0;
      const aNet = a.isDown ? -Math.abs(aPct) : Math.abs(aPct);
      const bNet = b.isDown ? -Math.abs(bPct) : Math.abs(bPct);
      return aNet - bNet;
    });
    return list.slice(0, 5);
  }, [liveList]);

  const handleRowClick = (item) => {
    openBuyWindow(item.symbol, "BUY", item.price);
  };

  return (
    <div className="gainers-losers-wrapper">
      {/* Top Gainers Card */}
      <div className="mover-card">
        <div className="mover-header">
          <div className="mover-title-group">
            <span className="card-title">Top gainers</span>
            <span className="category-tag">NIFTY 50</span>
          </div>
          <button
            type="button"
            className="view-all-link-btn"
            onClick={() => openMarketMovers("gainers")}
            title="View all Top Gainers across segments"
          >
            View all &rsaquo;
          </button>
        </div>
        <div className="mover-table">
          {topGainers.map((item) => {
            let flashClass = "";
            if (item.tickDirection === "up") flashClass = "tick-flash-up";
            else if (item.tickDirection === "down") flashClass = "tick-flash-down";

            return (
              <div
                className="mover-row clickable"
                key={item.symbol}
                onClick={() => handleRowClick(item)}
                title={`Click to buy ${item.symbol}`}
              >
                <div className="mover-symbol-info">
                  <span className="symbol-name">{item.symbol}</span>
                  <span className="exchange-label">{item.exchange || "NSE"}</span>
                </div>
                <div className="mover-price-info">
                  <span className={`price-val ${flashClass}`}>₹{Number(item.price).toFixed(2)}</span>
                  <span className={`percent-val ${item.isDown ? "text-down" : "text-up"}`}>
                    {item.percent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Losers Card */}
      <div className="mover-card">
        <div className="mover-header">
          <div className="mover-title-group">
            <span className="card-title">Top losers</span>
            <span className="category-tag">NIFTY 50</span>
          </div>
          <button
            type="button"
            className="view-all-link-btn"
            onClick={() => openMarketMovers("losers")}
            title="View all Top Losers across segments"
          >
            View all &rsaquo;
          </button>
        </div>
        <div className="mover-table">
          {topLosers.map((item) => {
            let flashClass = "";
            if (item.tickDirection === "up") flashClass = "tick-flash-up";
            else if (item.tickDirection === "down") flashClass = "tick-flash-down";

            return (
              <div
                className="mover-row clickable"
                key={item.symbol}
                onClick={() => handleRowClick(item)}
                title={`Click to trade ${item.symbol}`}
              >
                <div className="mover-symbol-info">
                  <span className="symbol-name">{item.symbol}</span>
                  <span className="exchange-label">{item.exchange || "NSE"}</span>
                </div>
                <div className="mover-price-info">
                  <span className={`price-val ${flashClass}`}>₹{Number(item.price).toFixed(2)}</span>
                  <span className={`percent-val ${item.isDown ? "text-down" : "text-up"}`}>
                    {item.percent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GainersLosersPanel;
