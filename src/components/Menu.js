import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import GeneralContext from "./GeneralContext";
import NotificationsDropdown from "./overlays/NotificationsDropdown";
import ProfileDropdown from "./overlays/ProfileDropdown";

const Menu = ({ mobileTitle = "" }) => {
  const {
    openBasketModal,
    isNotificationsOpen,
    toggleNotifications,
    closeNotifications,
    isProfileOpen,
    toggleProfile,
    closeProfile,
    currentUser,
    unreadCount,
  } = useContext(GeneralContext);

  return (
    <div className="menu-container">
      <div className="kite-brand">
        <NavLink to="/">
          <img src="/logo.png" alt="Zerodha Kite" className="kite-logo" />
        </NavLink>
        {mobileTitle && <span className="mobile-page-header-title">{mobileTitle}</span>}
      </div>

      <nav className="nav-links">
        <ul>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/orders"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/holdings"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Holdings
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/positions"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Positions
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/bids"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Bids
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/funds"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Funds
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="nav-utility-group">
        {/* Basket Modal Trigger */}
        <button
          className="nav-icon-btn basket-btn"
          title="Baskets (B)"
          onClick={openBasketModal}
          aria-label="Open Basket Orders"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </button>

        {/* Notifications Dropdown Trigger */}
        <div className="notifications-wrapper">
          <button
            className={`nav-icon-btn notifications-btn ${isNotificationsOpen ? "active" : ""}`}
            title="Notifications"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge" title={`${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationsDropdown isOpen={isNotificationsOpen} onClose={closeNotifications} />
        </div>

        <div className="nav-vertical-divider"></div>

        {/* User Profile Trigger */}
        <div className="profile-wrapper">
          <div className="profile-trigger" onClick={toggleProfile}>
            <div className="avatar">{currentUser?.avatarText || "CU"}</div>
            <span className="username">{currentUser?.userId || "ZU8842"}</span>
            <svg className={`chevron ${isProfileOpen ? "rotated" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <ProfileDropdown isOpen={isProfileOpen} onClose={closeProfile} />
        </div>
      </div>
    </div>
  );
};

export default Menu;
