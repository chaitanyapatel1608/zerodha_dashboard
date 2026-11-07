import React from "react";
import "./IpoAnalyticsDrawer.css";

const IpoAnalyticsDrawer = ({ isOpen, onClose, ipo, onApplyClick }) => {
  if (!isOpen || !ipo) return null;

  const gmpText = ipo.gmp || "+₹22 (+6.5%)";
  const issueSize = ipo.issueSize || "₹11,327 Cr";
  const freshIssue = ipo.freshIssue || "₹4,499 Cr";
  const ofs = ipo.ofs || "₹6,828 Cr";
  const registrar = ipo.registrar || "Link Intime India Pvt. Ltd.";
  const leadManagers = ipo.leadManagers || "Kotak Mahindra Capital, Citigroup Global, J.P. Morgan";
  const sub = ipo.subscription || { retail: "3.42x", qib: "12.50x", nii: "8.15x", total: "7.84x" };
  const timeline = ipo.timeline || {
    openDate: "06 Nov 2024",
    closeDate: "08 Nov 2024",
    allotmentDate: "11 Nov 2024",
    refundDate: "12 Nov 2024",
    dematCreditDate: "12 Nov 2024",
    listingDate: "13 Nov 2024",
  };

  return (
    <div className="ipo-drawer-backdrop" onClick={onClose}>
      <div className="ipo-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ipo-drawer-header">
          <div>
            <div className="ipo-header-tag-row">
              <span className="ipo-symbol-pill">{ipo.symbol}</span>
              <span className="ipo-type-pill">{ipo.type || "MAINBOARD IPO"}</span>
              <span className="ipo-gmp-pill">GMP: {gmpText}</span>
            </div>
            <h3 className="ipo-drawer-title">{ipo.name}</h3>
            <span className="ipo-drawer-dates">📅 Issue Period: {ipo.dates}</span>
          </div>
          <button className="ipo-drawer-close" onClick={onClose}>&times;</button>
        </div>

        {/* Content Body */}
        <div className="ipo-drawer-body">
          {/* Top Key Metrics Strip */}
          <div className="ipo-metrics-grid">
            <div className="ipo-metric-card">
              <span className="metric-label">Price Range</span>
              <span className="metric-val">{ipo.priceRange}</span>
              <span className="metric-sub">Per equity share</span>
            </div>
            <div className="ipo-metric-card">
              <span className="metric-label">Market Lot Size</span>
              <span className="metric-val">{ipo.minQty} Shares</span>
              <span className="metric-sub">Min. lot per bid</span>
            </div>
            <div className="ipo-metric-card">
              <span className="metric-label">Min. Investment</span>
              <span className="metric-val">{ipo.minAmount}</span>
              <span className="metric-sub">1 Lot at Cut-off</span>
            </div>
            <div className="ipo-metric-card">
              <span className="metric-label">Total Issue Size</span>
              <span className="metric-val">{issueSize}</span>
              <span className="metric-sub">Fresh + OFS</span>
            </div>
          </div>

          {/* Grey Market Premium & Listing Gains Highlight */}
          <div className="ipo-section-box gmp-box">
            <div className="section-header-row">
              <span className="section-title">Grey Market Premium (GMP Tracker)</span>
              <span className="gmp-status-live">● Live Market Estimate</span>
            </div>
            <div className="gmp-content-row">
              <div className="gmp-stat">
                <span className="gmp-big-val">{gmpText}</span>
                <span className="gmp-sub">Expected Listing Premium over Upper Band</span>
              </div>
              <div className="gmp-sentiment-badge">Bullish Demand</div>
            </div>
          </div>

          {/* Live Subscription Demand Bar */}
          <div className="ipo-section-box">
            <div className="section-header-row">
              <span className="section-title">Live Subscription Multiples (NSE & BSE Combined)</span>
              <span className="subscription-overall-pill">Overall: {sub.total}</span>
            </div>
            <div className="subscription-grid">
              <div className="sub-item">
                <span className="sub-category">Retail (RII)</span>
                <span className="sub-val text-green">{sub.retail}</span>
                <span className="sub-note">&le; ₹2,00,000</span>
              </div>
              <div className="sub-item">
                <span className="sub-category">Qualified Institutional (QIB)</span>
                <span className="sub-val text-blue">{sub.qib}</span>
                <span className="sub-note">FIIs & Mutual Funds</span>
              </div>
              <div className="sub-item">
                <span className="sub-category">Non-Institutional (NII / HNI)</span>
                <span className="sub-val text-purple">{sub.nii}</span>
                <span className="sub-note">&gt; ₹2,00,000</span>
              </div>
            </div>
          </div>

          {/* Issue Capital Structure Split */}
          <div className="ipo-section-box">
            <span className="section-title">Capital Structure & Issue Breakdown</span>
            <div className="capital-split-bar">
              <div className="split-fresh" style={{ flex: 4 }} title={`Fresh Issue: ${freshIssue}`}>
                Fresh Issue ({freshIssue})
              </div>
              <div className="split-ofs" style={{ flex: 6 }} title={`Offer for Sale (OFS): ${ofs}`}>
                Offer for Sale ({ofs})
              </div>
            </div>
            <div className="split-labels">
              <span>● <strong>Fresh Issue:</strong> Capital injected into company expansion</span>
              <span>● <strong>OFS:</strong> Existing promoters/investors monetizing shares</span>
            </div>
          </div>

          {/* IPO Milestone Timeline Stepper */}
          <div className="ipo-section-box">
            <span className="section-title">Tentative Allotment & Listing Schedule</span>
            <div className="timeline-stepper">
              <div className="timeline-step done">
                <div className="step-circle">1</div>
                <span className="step-title">Issue Opens</span>
                <span className="step-date">{timeline.openDate}</span>
              </div>
              <div className="timeline-step done">
                <div className="step-circle">2</div>
                <span className="step-title">Issue Closes</span>
                <span className="step-date">{timeline.closeDate}</span>
              </div>
              <div className="timeline-step">
                <div className="step-circle">3</div>
                <span className="step-title">Allotment Finalized</span>
                <span className="step-date">{timeline.allotmentDate}</span>
              </div>
              <div className="timeline-step">
                <div className="step-circle">4</div>
                <span className="step-title">Refunds Initiated</span>
                <span className="step-date">{timeline.refundDate}</span>
              </div>
              <div className="timeline-step">
                <div className="step-circle">5</div>
                <span className="step-title">Demat Credit</span>
                <span className="step-date">{timeline.dematCreditDate}</span>
              </div>
              <div className="timeline-step">
                <div className="step-circle">6</div>
                <span className="step-title">NSE / BSE Listing</span>
                <span className="step-date">{timeline.listingDate}</span>
              </div>
            </div>
          </div>

          {/* Intermediaries */}
          <div className="ipo-section-box info-box">
            <div className="info-row">
              <span className="info-key">Registrar to Issue:</span>
              <span className="info-val">{registrar}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Book Running Lead Managers:</span>
              <span className="info-val">{leadManagers}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Red Herring Prospectus (RHP):</span>
              <span className="info-val">
                <a href={ipo.rhpUrl || "https://www.sebi.gov.in"} target="_blank" rel="noreferrer" className="rhp-link">
                  View Official SEBI Filing ↗
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="ipo-drawer-footer">
          <button className="btn-kite-secondary" onClick={onClose}>Close</button>
          {ipo.status === "Apply" && (
            <button
              className="btn-kite-primary"
              onClick={() => {
                onClose();
                if (onApplyClick) onApplyClick(ipo);
              }}
            >
              Apply for this IPO &rarr;
            </button>
          )}
          {ipo.status === "Pre-apply" && (
            <button
              className="btn-kite-primary"
              style={{ background: "#475569" }}
              onClick={() => {
                onClose();
                if (onApplyClick) onApplyClick(ipo);
              }}
            >
              Pre-apply (Advance Order) &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IpoAnalyticsDrawer;
