import React, { useRef, useEffect, useContext } from "react";
import GeneralContext from "../GeneralContext";
import "./ProfileDropdown.css";

const ProfileDropdown = ({ isOpen, onClose }) => {
  const { currentUser, updateUser } = useContext(GeneralContext);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const profileTrigger = document.querySelector(".profile-trigger");
        if (!profileTrigger || !profileTrigger.contains(event.target)) {
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

  const togglePrivacy = () => {
    updateUser({ isPrivacyMode: !currentUser.isPrivacyMode });
  };

  const toggleTheme = () => {
    updateUser({ theme: currentUser.theme === "dark" ? "light" : "dark" });
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="profile-user-card">
        <div className="profile-avatar-large">{currentUser.avatarText || "CU"}</div>
        <div className="profile-user-details">
          <div className="user-name-row">
            <span className="user-full-name">{currentUser.name}</span>
            <span className="user-id-badge">{currentUser.userId}</span>
          </div>
          <span className="user-email">{currentUser.email}</span>
        </div>
      </div>

      <div className="profile-divider"></div>

      <div className="profile-toggle-row">
        <div className="toggle-label">
          <span>Privacy mode</span>
          <small>Mask account balances & P&L</small>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={currentUser.isPrivacyMode}
            onChange={togglePrivacy}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div className="profile-toggle-row">
        <div className="toggle-label">
          <span>Dark theme</span>
          <small>Switch interface appearance</small>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={currentUser.theme === "dark"}
            onChange={toggleTheme}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div className="profile-divider"></div>

      <div className="profile-menu-links">
        <a href="#console" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">Console</span>
          <span className="link-meta">Reports, P&L, Statements</span>
        </a>
        <a href="#coin" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">Coin</span>
          <span className="link-meta">Direct Mutual Funds</span>
        </a>
        <a href="#support" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">Support portal</span>
        </a>
        <a href="#invite" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">Invite friends</span>
        </a>
        <a href="#shortcuts" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">Keyboard shortcuts</span>
          <span className="shortcut-badge">Ctrl + /</span>
        </a>
        <a href="#manual" className="profile-link-item" onClick={(e) => e.preventDefault()}>
          <span className="link-title">User manual</span>
        </a>
      </div>

      <div className="profile-divider"></div>

      <div className="profile-footer">
        <button
          className="logout-btn"
          onClick={() => {
            alert("Signed out from simulated session.");
            onClose();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
