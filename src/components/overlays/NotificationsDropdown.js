import React, { useRef, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import "./NotificationsDropdown.css";

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "Just now";
  const now = new Date();
  const date = new Date(dateInput);
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 10) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

const NotificationsDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("ALL"); // "ALL" | "ORDER" | "FUNDS" | "COMPLIANCE"

  const {
    notifications = [],
    unreadCount = 0,
    fetchNotifications = () => {},
    markNotificationAsRead = () => {},
    markAllNotificationsAsRead = () => {},
    deleteNotification = () => {},
    clearAllNotifications = () => {},
  } = useContext(GeneralContext);

  // Auto-refresh when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle clicking outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const bellBtn = document.querySelector(".nav-icon-btn.notifications-btn");
        if (!bellBtn || !bellBtn.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items by selected segment
  const safeList = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = safeList.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.type === activeFilter;
  });

  // Handle deep-link click (Option A: Interactive Deep Links)
  const handleItemClick = (item) => {
    if (item.unread) {
      markNotificationAsRead(item._id);
    }
    onClose();

    if (item.metadata?.actionUrl) {
      navigate(item.metadata.actionUrl, {
        state: {
          highlightSymbol: item.metadata.symbol,
          highlightOrderId: item.metadata.orderId,
        },
      });
    }
  };

  const getNotificationIcon = (type, mode) => {
    switch (type) {
      case "ORDER":
        return (
          <div className={`notif-type-icon ${mode === "SELL" ? "icon-sell" : "icon-buy"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        );
      case "FUNDS":
        return (
          <div className="notif-type-icon icon-funds">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        );
      case "COMPLIANCE":
        return (
          <div className="notif-type-icon icon-compliance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
        );
      case "GTT":
        return (
          <div className="notif-type-icon icon-gtt">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
        );
      default:
        return (
          <div className="notif-type-icon icon-general">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="notifications-dropdown" ref={dropdownRef}>
      {/* Dropdown Header */}
      <div className="notifications-header">
        <div className="title-group">
          <span className="title">Notifications</span>
          {unreadCount > 0 && <span className="unread-pill">{unreadCount} new</span>}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button
              className="mark-read-btn"
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Segment Filter Tabs */}
      <div className="notifications-filter-tabs">
        <button
          className={`filter-tab ${activeFilter === "ALL" ? "active" : ""}`}
          onClick={() => setActiveFilter("ALL")}
        >
          All
        </button>
        <button
          className={`filter-tab ${activeFilter === "ORDER" ? "active" : ""}`}
          onClick={() => setActiveFilter("ORDER")}
        >
          Orders
        </button>
        <button
          className={`filter-tab ${activeFilter === "FUNDS" ? "active" : ""}`}
          onClick={() => setActiveFilter("FUNDS")}
        >
          Funds
        </button>
        <button
          className={`filter-tab ${activeFilter === "COMPLIANCE" ? "active" : ""}`}
          onClick={() => setActiveFilter("COMPLIANCE")}
        >
          Account
        </button>
      </div>

      {/* Notifications Body */}
      <div className="notifications-body">
        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-bell-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <p className="empty-title">No notifications yet</p>
            <p className="empty-sub">
              Live alerts for order executions, margin updates, and Demat compliance will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item._id || item.id}
              className={`notification-item ${item.unread ? "unread" : ""}`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              title="Click to view details"
            >
              <div className="item-icon-col">
                {getNotificationIcon(item.type, item.metadata?.mode)}
              </div>
              <div className="item-content-col">
                <div className="item-header">
                  <span className="item-title">{item.title}</span>
                  <span className="item-time">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <p className="item-desc">{item.description}</p>
                {item.metadata?.actionUrl && (
                  <span className="item-action-hint">
                    View in {item.metadata.actionUrl.replace("/", "")} &rsaquo;
                  </span>
                )}
              </div>
              <button
                className="item-delete-btn"
                title="Dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(item._id || item.id);
                }}
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      {/* Dropdown Footer */}
      {safeList.length > 0 && (
        <div className="notifications-footer">
          <button
            className="footer-btn clear-all-link"
            onClick={clearAllNotifications}
          >
            Clear all
          </button>
          <button
            className="footer-btn view-orders-link"
            onClick={() => {
              onClose();
              navigate("/orders");
            }}
          >
            View all orders &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
