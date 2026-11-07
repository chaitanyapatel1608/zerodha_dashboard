import React, { useState } from "react";
import "./IpoFaqModal.css";

const FAQ_ITEMS = [
  {
    q: "How does the UPI Mandate process work for IPOs?",
    a: "When you apply for an IPO on Kite, an ASBA mandate request is initiated through the National Payments Corporation of India (NPCI) and dispatched to your registered UPI mobile app (Google Pay, PhonePe, BHIM, etc.). Once you approve the mandate using your UPI PIN, the application money is not debited immediately—it remains blocked in your bank account, continuing to earn savings interest until allotment.",
  },
  {
    q: "What are the UPI mandate processing hours?",
    a: "UPI mandate requests are processed between 10:00 AM and 5:00 PM on trading days. Mandates submitted after 5:00 PM or during pre-market windows will be processed on the next working day when the primary exchange bidding books open.",
  },
  {
    q: "What is Cut-off Price and why is it recommended?",
    a: "The cut-off price is the final issue price decided by the issuer in consultation with book running lead managers after evaluating all institutional and retail bids. Selecting 'Cut-off price' guarantees that your application participates at the final cleared price, preventing bid rejection if the issue closes at the upper band.",
  },
  {
    q: "What is the difference between Retail (RII) and HNI categories?",
    a: "Retail Individual Investors (RII) can apply for bids up to ₹2,00,000 with a minimum guaranteed lot allotment logic under SEBI rules. Non-Institutional Investors (NII / HNI) can bid between ₹2,00,000 and ₹5,00,000 using UPI ASBA (or higher via Syndicate ASBA). Bids above ₹2 Lakhs are categorized as sNII (₹2L–₹10L) and bNII (above ₹10L).",
  },
  {
    q: "Can I modify or cancel my IPO bid after submitting?",
    a: "Yes! You can amend your bid (increase or decrease lots, change price, or update UPI handle) or revoke/cancel your application anytime before 5:00 PM on the issue closing date. When you cancel, the bank lien is automatically revoked.",
  },
  {
    q: "What happens if I don't get an allotment?",
    a: "If your application is not allotted shares, the registrar unblocks the lien on your bank account within 1-2 business days from the Basis of Allotment date. The funds become available for your regular use automatically.",
  },
];

const IpoFaqModal = ({ isOpen, onClose }) => {
  const [openIdx, setOpenIdx] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="ipo-faq-overlay" onClick={onClose}>
      <div className="ipo-faq-container" onClick={(e) => e.stopPropagation()}>
        <div className="ipo-faq-header">
          <div>
            <span className="faq-badge">SEBI ASBA & UPI MANDATE KNOWLEDGE BASE</span>
            <h3 className="faq-title">IPO Bids, ASBA & UPI Mandate FAQs</h3>
            <span className="faq-sub">Official guide to bidding, bank lien blocking, allotment, and refunds</span>
          </div>
          <button className="faq-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="ipo-faq-body">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className={`faq-accordion-item ${openIdx === idx ? "active" : ""}`}
              onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
            >
              <div className="faq-question-row">
                <span className="faq-q-text">{item.q}</span>
                <span className="faq-arrow">{openIdx === idx ? "▲" : "▼"}</span>
              </div>
              {openIdx === idx && (
                <div className="faq-answer-row">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ipo-faq-footer">
          <span className="faq-footer-note">Zerodha Broking Ltd. &bull; Registered SEBI Syndicate Intermediary</span>
          <button className="btn-kite-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
};

export default IpoFaqModal;
