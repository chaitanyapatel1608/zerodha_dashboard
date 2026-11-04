import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import "./MobileBottomNav.css";

const MobileBottomNav = () => {
  const location = useLocation();
  const { currentUser } = useContext(GeneralContext);
  const currentPath = location.pathname;

  const isWatchlistActive = currentPath === "/" || currentPath === "/watchlist";
  const isOrdersActive = currentPath === "/orders";
  const isPortfolioActive = currentPath === "/holdings" || currentPath === "/positions";
  const isBidsActive = currentPath === "/bids" || currentPath === "/apps";
  const isAccountActive = currentPath === "/funds" || currentPath === "/account";

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Watchlist Tab */}
      <NavLink
        to="/"
        className={`bottom-nav-item ${isWatchlistActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </span>
        <span className="bottom-nav-label">Watchlist</span>
      </NavLink>

      {/* 2. Orders Tab */}
      <NavLink
        to="/orders"
        className={`bottom-nav-item ${isOrdersActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
        <span className="bottom-nav-label">Orders</span>
      </NavLink>

      {/* 3. Portfolio Tab */}
      <NavLink
        to="/holdings"
        className={`bottom-nav-item ${isPortfolioActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </span>
        <span className="bottom-nav-label">Portfolio</span>
      </NavLink>

      {/* 4. Bids Tab */}
      <NavLink
        to="/bids"
        className={`bottom-nav-item ${isBidsActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </span>
        <span className="bottom-nav-label">Bids</span>
      </NavLink>

      {/* 5. Account Tab */}
      <NavLink
        to="/funds"
        className={`bottom-nav-item ${isAccountActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon user-nav-avatar">
          {currentUser?.avatarText || "ZU"}
        </span>
        <span className="bottom-nav-label">{currentUser?.userId || "Account"}</span>
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;
