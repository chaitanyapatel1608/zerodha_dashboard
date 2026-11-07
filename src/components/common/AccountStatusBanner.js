import React, { useContext } from "react";
import GeneralContext from "../GeneralContext";
import "./AccountStatusBanner.css";

const AccountStatusBanner = ({ message, linkText = "Add nominee", linkUrl = "#", onLinkClick }) => {
  const {
    currentUser,
    openNomineeModal,
    openSegmentModal,
    userSegments = {},
  } = useContext(GeneralContext);

  const isNomineeVerified = currentUser?.nomineeStatus === "VERIFIED";
  const isNomineeOptedOut = currentUser?.nomineeStatus === "OPTED_OUT";

  // Check if this banner relates to nominee
  const isNomineeBanner =
    linkText === "Add nominee" ||
    linkText === "View nominee" ||
    (message && message.includes("Nominee"));

  // Check if this banner relates to segment activation / kill switch
  const isSegmentBanner =
    linkText === "Segments settings" ||
    (message && message.toLowerCase().includes("segment"));

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
  } else if (isSegmentBanner && userSegments && Object.keys(userSegments).length > 0) {
    // Check if any segment is deactivated via Kill Switch
    let isAnyLocked = false;
    let lockedNames = [];
    const now = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    for (const seg of Object.values(userSegments)) {
      if (!seg.active && seg.deactivatedAt) {
        const elapsed = now - new Date(seg.deactivatedAt).getTime();
        if (elapsed < twelveHoursMs) {
          isAnyLocked = true;
          lockedNames.push(seg.name || "Segment");
        }
      }
    }

    const activeList = [];
    if (userSegments.equity?.active) activeList.push("NSE & BSE Equity");
    if (userSegments.futuresAndOptions?.active) activeList.push("NSE F&O");
    if (userSegments.currency?.active) activeList.push("Currency");
    if (userSegments.commodity?.active) activeList.push("MCX Commodity");

    if (isAnyLocked) {
      bannerClass = "account-status-banner banner-warning";
      displayMessage = `Account status: ${lockedNames.join(", ")} deactivated via Kill Switch. Orders blocked.`;
    } else if (activeList.length > 0) {
      displayMessage = `Account status: Orders placement is active for ${activeList.join(" and ")} segments.`;
    }
    displayLinkText = "Segments settings";
  }

  const handleLinkClick = (e) => {
    e.preventDefault();
    if (typeof onLinkClick === "function") {
      onLinkClick();
      return;
    }
    if (isNomineeBanner) {
      openNomineeModal();
    } else if (
      isSegmentBanner ||
      linkText.toLowerCase().includes("segment") ||
      displayLinkText.toLowerCase().includes("segment")
    ) {
      if (typeof openSegmentModal === "function") {
        openSegmentModal();
      }
    }
  };

  return (
    <div className={bannerClass}>
      <span className="banner-icon" aria-hidden="true">
        {isNomineeVerified ? (
          <i className="fa-solid fa-circle-check text-success"></i>
        ) : isSegmentBanner && bannerClass.includes("banner-warning") ? (
          "⚠️"
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
