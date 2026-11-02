import React, { useRef, useEffect } from "react";
import { notificationsList } from "../../data/mockData";
import "./NotificationsDropdown.css";

const NotificationsDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Only trigger if click wasn't on the bell button itself
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

  return (
    <div className="notifications-dropdown" ref={dropdownRef}>
      <div className="notifications-header">
        <span className="title">Notifications</span>
        <button className="mark-read-btn" onClick={() => alert("Marked all as read")}>
          Mark all as read
        </button>
      </div>

      <div className="notifications-body">
        {notificationsList.length === 0 ? (
          <div className="notifications-empty">
            <p>No new notifications</p>
          </div>
        ) : (
          notificationsList.map((item) => (
            <div key={item.id} className={`notification-item ${item.unread ? "unread" : ""}`}>
              <div className="item-header">
                <span className="item-title">{item.title}</span>
                <span className="item-time">{item.time}</span>
              </div>
              <p className="item-desc">{item.description}</p>
            </div>
          ))
        )}
      </div>

      <div className="notifications-footer">
        <a href="#view-all" onClick={(e) => e.preventDefault()}>
          View past notifications &bull;
        </a>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
