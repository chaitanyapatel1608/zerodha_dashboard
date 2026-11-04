import React, { useContext } from "react";
import GeneralContext from "../GeneralContext";
import "./AccountStatusBanner.css";

const AccountStatusBanner = ({ message, linkText = "Add nominee", linkUrl = "#" }) => {
  const { currentUser, openNomineeModal } = useContext(GeneralContext);

  const isNomineeVerified = currentUser?.nomineeStatus === "VERIFIED";
  const isNomineeOptedOut = currentUser?.nomineeStatus === "OPTED_OUT";

  // Check if this banner relates to nominee / segment activation
  const isNomineeBanner =
    linkText === "Add nominee" ||
    linkText === "View nominee" ||
    (message && message.includes("Nominee"));

  let displayMessage = message;
  let displayLinkText = linkText;
  let bannerClass = "account-status-banner";

  if (isNomineeBanner) {
    if (isNomineeVerified) {
      bannerClass = "account-status-banner banner-verified";
      displayMessage =
        "Account status: All SEBI KYC, Nominee, and CDSL Demat requirements are 100% verified.";
      displayLinkText = "View nominee";
    } else if (isNomineeOptedOut) {
      bannerClass = "account-status-banner";
      displayMessage =
        "Account status: Demat nomination opted out as per SEBI declaration. You can nominate anytime.";
      displayLinkText = "Add nominee";
    } else {
      displayMessage =
        "Account status: Your equity and derivatives account is active. Nominee addition pending.";
      displayLinkText = "Add nominee";
    }
  }

  const handleLinkClick = (e) => {
    e.preventDefault();
    if (isNomineeBanner) {
      openNomineeModal();
    }
  };

  return (
    <div className={bannerClass}>
      <span className="banner-icon" aria-hidden="true">
        {isNomineeVerified ? (
          <i className="fa-solid fa-circle-check text-success"></i>
        ) : (
          "ℹ"
        )}
      </span>
      <span className="banner-text">{displayMessage}</span>
      <a href={linkUrl} className="banner-link" onClick={handleLinkClick}>
        {displayLinkText}
      </a>
    </div>
  );
};

export default AccountStatusBanner;
