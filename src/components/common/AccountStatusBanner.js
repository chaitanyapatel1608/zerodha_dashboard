import React from "react";
import "./AccountStatusBanner.css";

const AccountStatusBanner = ({ message, linkText = "Activate now", linkUrl = "#" }) => {
  return (
    <div className="account-status-banner">
      <span className="banner-icon" aria-hidden="true">ℹ</span>
      <span className="banner-text">
        {message || "Account status: You have 1 mandatory segment activation pending for MCX Commodity."}
      </span>
      <a href={linkUrl} className="banner-link" onClick={(e) => e.preventDefault()}>
        {linkText}
      </a>
    </div>
  );
};

export default AccountStatusBanner;
