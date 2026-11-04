import React from "react";
import { useLocation } from "react-router-dom";
import Menu from "./Menu";
import { useMarketFeed } from "../context/MarketFeedContext";

const TopBar = () => {
  const { indices, isLive } = useMarketFeed();
  const location = useLocation();

  const isWatchlist = location.pathname === "/" || location.pathname === "/watchlist";

  const getMobileTitle = () => {
    switch (location.pathname) {
      case "/orders":
        return "Orders";
      case "/holdings":
        return "Holdings";
      case "/positions":
        return "Positions";
      case "/bids":
      case "/apps":
        return "Bids";
      case "/funds":
      case "/account":
        return "Funds & Account";
      case "/dashboard":
        return "Dashboard";
      default:
        return "";
    }
  };

  return (
    <header className={`topbar-container ${isWatchlist ? "show-mobile-indices" : "hide-mobile-indices"}`}>
      {/* On mobile, only shown if on Watchlist (Option B) */}
      <div className={`indices-container ${!isWatchlist ? "mobile-hidden-indices" : ""}`}>
        {indices.map((idx, index) => {
          let flashClass = "";
          if (idx.tickDirection === "up") flashClass = "tick-flash-up";
          else if (idx.tickDirection === "down") flashClass = "tick-flash-down";

          return (
            <div className={`index-item ${flashClass}`} key={index}>
              <span className="index-name">{idx.name}</span>
              <span className="index-value">{idx.value}</span>
              <span className={`index-change ${idx.isDown ? "down" : "up"}`}>
                {idx.change} ({idx.percent})
              </span>
            </div>
          );
        })}

        <div className="market-live-pill" title="NSE &amp; BSE Real-time Tick Feed Active">
          <span className={`live-pulse-dot ${isLive ? "pulse-active" : ""}`}></span>
          <span className="live-pill-text">LIVE</span>
        </div>
      </div>

      <Menu mobileTitle={getMobileTitle()} isWatchlist={isWatchlist} />
    </header>
  );
};

export default TopBar;
