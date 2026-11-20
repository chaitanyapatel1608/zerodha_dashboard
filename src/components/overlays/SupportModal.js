import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./SupportModal.css";

import { API_BASE, AUTH_PORTAL_URL } from "../../config/api";

const FAQ_ITEMS = [
  {
    category: "FUNDS",
    q: "How are funds credited and settled?",
    a: "UPI deposits are credited instantly 24x7 with zero fees. Equity sell proceeds are 80% available for trading instantly, and 100% available for withdrawal on T+1 day upon clearing corporation settlement.",
  },
  {
    category: "DEMAT",
    q: "How does Demat margin pledging work?",
    a: "Eligible shares held in your Demat account can be pledged for extra trading margin. SEBI standard haircuts (12.5% to 20%) apply. Corporate benefits like dividends continue to accrue to you.",
  },
  {
    category: "ORDERS",
    q: "What is the auto square-off cut-off time?",
    a: "All intraday MIS positions are automatically squared off by RMS engines between 15:20 and 15:25 IST for Equity and F&O, and 23:15 IST for Commodities.",
  },
  {
    category: "ACCOUNT",
    q: "How do I update my primary bank account?",
    a: "Navigate to Funds > Verified Bank Account > + Add Bank Account. Once verified via NPCI Penny Drop, click 'Set as Primary' to make it your default payout bank.",
  },
  {
    category: "ORDERS",
    q: "Why was my market order rejected?",
    a: "Orders are rejected by exchange RMS if margin is insufficient, circuit limit has been hit, or the segment (e.g. BSE F&O) is inactive on your account. You can verify active segments in Profile > Segments.",
  },
];

const QUICK_TAGS = [
  { label: "Pending Payout", cat: "FUNDS" },
  { label: "Margin Shortfall", cat: "FUNDS" },
  { label: "MIS Order Rejected", cat: "ORDERS" },
  { label: "Demat T-PIN Issue", cat: "DEMAT" },
  { label: "Nominee Update", cat: "ACCOUNT" },
];

const FAQ_CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "FUNDS", label: "Funds" },
  { id: "ORDERS", label: "Orders" },
  { id: "DEMAT", label: "Demat" },
  { id: "ACCOUNT", label: "Account" },
];

const SupportModal = ({
  isOpen,
  onClose,
  initialTab = "SUPPORT",
  showToast,
  currentUser = null,
  fetchNotifications = null,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileSupportView, setMobileSupportView] = useState("TICKET"); // "TICKET" | "FAQ"
  const [faqCategory, setFaqCategory] = useState("ALL");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("ORDERS");
  const [ticketPriority, setTicketPriority] = useState("NORMAL");
  const [ticketDesc, setTicketDesc] = useState("");
  const [searchFaq, setSearchFaq] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Submission & database state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  const activeUserId = currentUser?.userId || "";

  // Fetch user tickets from database
  const fetchUserTickets = useCallback(async () => {
    if (!activeUserId) return;
    setIsLoadingTickets(true);
    try {
      const res = await axios.get(`${API_BASE}/mySupportTickets`, {
        params: { userId: activeUserId },
      });
      if (res.data && res.data.success) {
        setUserTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.warn("Could not fetch support tickets:", err.message);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchUserTickets();
    }
  }, [isOpen, fetchUserTickets]);

  if (!isOpen) return null;

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = faqCategory === "ALL" || item.category === faqCategory;
    const matchesSearch =
      !searchFaq.trim() ||
      item.q.toLowerCase().includes(searchFaq.toLowerCase()) ||
      item.a.toLowerCase().includes(searchFaq.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApplyQuickTag = (tag) => {
    setTicketCategory(tag.cat);
    setTicketSubject(`[${tag.label}] `);
  };

  const handleCopyTicketId = (id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    setIsSubmitting(true);
    try {
      const categoryLabels = {
        FUNDS: "Funds, Payouts & Margins",
        ORDERS: "Order Placement & Fills",
        DEMAT: "Demat, Pledging & Holdings",
        ACCOUNT: "Account Settings & KYC",
        TECH: "Technical & Platform Query",
      };

      const payload = {
        userId: activeUserId,
        userName: currentUser?.name || "Trader",
        userEmail: currentUser?.email || "",
        category: ticketCategory,
        categoryLabel: categoryLabels[ticketCategory] || "General Support",
        subject: ticketSubject.trim(),
        description: ticketDesc.trim(),
        priority: ticketPriority,
      };

      const res = await axios.post(`${API_BASE}/createSupportTicket`, payload);

      if (res.data && res.data.success) {
        const ticket = res.data.ticket;
        setSubmittedTicket(ticket);
        setUserTickets((prev) => [ticket, ...prev]);

        if (showToast) {
          showToast(
            "Support Ticket Raised",
            `Ticket #${ticket.ticketId} registered in database. SLA: 2 business hours.`,
            "success"
          );
        }

        if (fetchNotifications) {
          fetchNotifications();
        }

        // Reset form inputs
        setTicketSubject("");
        setTicketDesc("");
        setTicketPriority("NORMAL");
      } else {
        if (showToast) {
          showToast("Error", res.data?.message || "Failed to submit ticket", "error");
        }
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      const errMsg = err.response?.data?.message || err.message || "Network error submitting ticket";
      if (showToast) {
        showToast("Ticket Submission Failed", errMsg, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setTicketSubject("");
    setTicketDesc("");
    setTicketPriority("NORMAL");
  };

  return (
    <div className="support-modal-backdrop" onClick={onClose}>
      <div className="support-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className="mobile-sheet-drag-handle" />

        {/* Header */}
        <div className="support-modal-header">
          <div className="support-header-left">
            <div className="support-badge-row">
              <span className="support-badge">HELP &amp; KNOWLEDGE DESK</span>
              <span className="support-user-badge">Client: {activeUserId}</span>
            </div>
            <h3 className="support-title">
              {activeTab === "SUPPORT" && "Support Portal & Helpdesk"}
              {activeTab === "MY_TICKETS" && "My Support Tickets Desk"}
              {activeTab === "MANUAL" && "Kite User Manual & Trading Guide"}
            </h3>
            <span className="support-subtitle">
              Instant trading FAQs, official SEBI rules &amp; priority customer desk
            </span>
          </div>
          <button className="support-close-btn" onClick={onClose} title="Close window" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="support-tabs">
          <button
            type="button"
            className={`support-tab-btn ${activeTab === "SUPPORT" ? "active" : ""}`}
            onClick={() => setActiveTab("SUPPORT")}
          >
            <span>Support &amp; FAQs</span>
          </button>
          <button
            type="button"
            className={`support-tab-btn ${activeTab === "MY_TICKETS" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("MY_TICKETS");
              fetchUserTickets();
            }}
          >
            <span>My Tickets</span>
            {userTickets.length > 0 && (
              <span className="tab-count-badge">{userTickets.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`support-tab-btn ${activeTab === "MANUAL" ? "active" : ""}`}
            onClick={() => setActiveTab("MANUAL")}
          >
            <span>Manual &amp; Product Codes</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="support-modal-body">
          {/* ================= TAB 1: SUPPORT PORTAL ================= */}
          {activeTab === "SUPPORT" && (
            <>
              {/* Mobile Sub-Switcher: Browse FAQs vs Create Ticket */}
              <div className="support-mobile-subtoggle">
                <button
                  type="button"
                  className={`subtoggle-btn ${mobileSupportView === "TICKET" ? "active" : ""}`}
                  onClick={() => setMobileSupportView("TICKET")}
                >
                  <span>✍️ Create Ticket</span>
                </button>
                <button
                  type="button"
                  className={`subtoggle-btn ${mobileSupportView === "FAQ" ? "active" : ""}`}
                  onClick={() => setMobileSupportView("FAQ")}
                >
                  <span>🔍 Search FAQs ({filteredFaqs.length})</span>
                </button>
              </div>

              <div className={`support-content-split mobile-view-${mobileSupportView.toLowerCase()}`}>
                {/* Left Column: FAQs & Guides */}
                <div className="support-left-faq">
                  <div className="faq-search-wrap">
                    <div className="faq-search-box">
                      <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        value={searchFaq}
                        onChange={(e) => setSearchFaq(e.target.value)}
                        placeholder="Search FAQs (funds, margin, auto square-off)..."
                        className="faq-search-input"
                      />
                      {searchFaq && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={() => setSearchFaq("")}
                          aria-label="Clear search"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FAQ Category Pills */}
                  <div className="faq-categories-row">
                    {FAQ_CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        className={`faq-cat-chip ${faqCategory === cat.id ? "active" : ""}`}
                        onClick={() => setFaqCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="faq-accordion-list">
                    {filteredFaqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                          <button
                            type="button"
                            className="faq-question-btn"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          >
                            <span className="faq-category-mini-badge">{faq.category}</span>
                            <span className="faq-q-text">{faq.q}</span>
                            <span className={`faq-chevron ${isOpen ? "rotated" : ""}`}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          </button>
                          {isOpen && <div className="faq-answer">{faq.a}</div>}
                        </div>
                      );
                    })}
                    {filteredFaqs.length === 0 && (
                      <div className="no-faqs-found">
                        No matching FAQs found for "{searchFaq}".
                      </div>
                    )}
                  </div>

                  {/* Mobile Nudge to Ticket Desk */}
                  <div className="faq-mobile-nudge">
                    <span className="nudge-title">Can't find your answer?</span>
                    <button
                      type="button"
                      className="btn-nudge-ticket"
                      onClick={() => setMobileSupportView("TICKET")}
                    >
                      + Raise a Support Ticket &rarr;
                    </button>
                  </div>
                </div>

              {/* Right Column: Ticket Desk or Success Confirmation */}
              <div className="support-right-ticket">
                {submittedTicket ? (
                  /* Institutional Success Card */
                  <div className="ticket-success-card">
                    <div className="success-icon-wrap">
                      <div className="success-check-circle">✓</div>
                    </div>

                    <h4 className="success-headline">Support Ticket Registered!</h4>
                    <p className="success-subtext">
                      Your query has been logged in the Kite database. Our dedicated support team is reviewing it.
                    </p>

                    <div className="ticket-confirmation-box">
                      <div className="ticket-id-strip">
                        <div className="ticket-id-meta">
                          <span className="ticket-id-label">Ticket Reference ID</span>
                          <span className="ticket-id-val">#{submittedTicket.ticketId}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-id"
                          onClick={() => handleCopyTicketId(submittedTicket.ticketId)}
                          title="Copy Ticket ID"
                        >
                          {copiedId ? "✓ Copied" : "Copy ID"}
                        </button>
                      </div>

                      <div className="ticket-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Category</span>
                          <span className="detail-val">{submittedTicket.categoryLabel}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Priority</span>
                          <span className={`priority-tag ${submittedTicket.priority?.toLowerCase()}`}>
                            {submittedTicket.priority}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status</span>
                          <span className="status-pill-open">● OPEN</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Expected SLA</span>
                          <span className="sla-highlight">Within 2 hours</span>
                        </div>
                      </div>

                      <div className="ticket-preview-summary">
                        <strong>Subject:</strong> {submittedTicket.subject}
                      </div>
                    </div>

                    <div className="success-actions-row">
                      <button
                        type="button"
                        className="btn-success-primary"
                        onClick={() => {
                          setActiveTab("MY_TICKETS");
                          setSubmittedTicket(null);
                        }}
                      >
                        View in My Tickets ({userTickets.length})
                      </button>
                      <button
                        type="button"
                        className="btn-success-secondary"
                        onClick={handleResetForm}
                      >
                        + Create Another Ticket
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Create Ticket Form */
                  <form onSubmit={handleSubmitTicket} className="ticket-form">
                    <div className="ticket-form-header">
                      <span className="ticket-title">Create Support Ticket</span>
                      <span className="sla-badge">Avg. Response: 2h</span>
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="quick-tags-section">
                      <span className="quick-tags-label">Quick issues:</span>
                      <div className="quick-tags-wrap">
                        {QUICK_TAGS.map((tag, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className="tag-chip"
                            onClick={() => handleApplyQuickTag(tag)}
                          >
                            + {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div className="form-group-sm">
                      <label htmlFor="ticket-category">Category</label>
                      <select
                        id="ticket-category"
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="ticket-select"
                      >
                        <option value="ORDERS">Order Placement &amp; Fills</option>
                        <option value="FUNDS">Funds, Payouts &amp; Margins</option>
                        <option value="DEMAT">Demat, Pledging &amp; Holdings</option>
                        <option value="ACCOUNT">Account Settings &amp; KYC</option>
                        <option value="TECH">Technical &amp; Platform Query</option>
                      </select>
                    </div>

                    {/* Priority Selector Pills */}
                    <div className="form-group-sm">
                      <label>Priority Level</label>
                      <div className="priority-pill-selector">
                        <button
                          type="button"
                          className={`pill-btn normal ${ticketPriority === "NORMAL" ? "active" : ""}`}
                          onClick={() => setTicketPriority("NORMAL")}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          className={`pill-btn high ${ticketPriority === "HIGH" ? "active" : ""}`}
                          onClick={() => setTicketPriority("HIGH")}
                        >
                          High
                        </button>
                        <button
                          type="button"
                          className={`pill-btn urgent ${ticketPriority === "URGENT" ? "active" : ""}`}
                          onClick={() => setTicketPriority("URGENT")}
                        >
                          Urgent (1h SLA)
                        </button>
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div className="form-group-sm">
                      <div className="label-with-count">
                        <label htmlFor="ticket-subject">Subject</label>
                        <span className="char-count">{ticketSubject.length}/100</span>
                      </div>
                      <input
                        id="ticket-subject"
                        type="text"
                        maxLength={100}
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Brief summary of the issue (e.g. UPI payin not credited)"
                        className="ticket-input"
                        required
                      />
                    </div>

                    {/* Description Textarea */}
                    <div className="form-group-sm">
                      <div className="label-with-count">
                        <label htmlFor="ticket-description">Description</label>
                        <span className="char-count">{ticketDesc.length}/500</span>
                      </div>
                      <textarea
                        id="ticket-description"
                        rows="3"
                        maxLength={500}
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        placeholder="Explain the problem in detail with order/UTR reference number if applicable..."
                        className="ticket-textarea"
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !ticketSubject.trim() || !ticketDesc.trim()}
                      className={`btn-submit-ticket ${isSubmitting ? "loading" : ""}`}
                    >
                      {isSubmitting ? (
                        <span className="btn-loading-flex">
                          <span className="spinner-sm"></span> Registering Ticket in DB...
                        </span>
                      ) : (
                        "Submit Ticket"
                      )}
                    </button>
                  </form>
                )}

                {/* RM / Call & Trade Contact */}
                <div className="support-contact-card">
                  <div className="contact-item">
                    <strong>Call &amp; Trade Desk:</strong>
                    <span>080 4718 1888 (NSE / BSE Clearing)</span>
                  </div>
                  <div className="contact-item">
                    <strong>Support Email:</strong>
                    <span>support@zerodha.com</span>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {/* ================= TAB 2: MY TICKETS ================= */}
          {activeTab === "MY_TICKETS" && (
            <div className="my-tickets-view">
              <div className="my-tickets-header-row">
                <div>
                  <h4 className="my-tickets-title">Your Support History ({userTickets.length})</h4>
                  <span className="my-tickets-meta">
                    Registered tickets linked to Client ID <strong>{activeUserId}</strong>
                  </span>
                </div>
                <div className="my-tickets-actions">
                  <button
                    type="button"
                    className="btn-refresh-tickets"
                    onClick={fetchUserTickets}
                    title="Refresh status from MongoDB Atlas"
                  >
                    ↻ Refresh
                  </button>
                  <button
                    type="button"
                    className="btn-raise-ticket-link"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setActiveTab("SUPPORT");
                    }}
                  >
                    + Create New Ticket
                  </button>
                </div>
              </div>

              {isLoadingTickets ? (
                <div className="tickets-loading-state">
                  <span className="spinner-md"></span>
                  <span>Fetching support tickets from database...</span>
                </div>
              ) : userTickets.length === 0 ? (
                <div className="empty-tickets-state">
                  <div className="empty-icon-shield">🎫</div>
                  <h4>No Support Tickets Found</h4>
                  <p>
                    You haven't submitted any support requests yet. If you encounter any issues with trades, funds, or Demat services, submit a ticket from the Support Portal.
                  </p>
                  <button
                    type="button"
                    className="btn-empty-create"
                    onClick={() => setActiveTab("SUPPORT")}
                  >
                    Create Your First Ticket
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="tickets-table-container desktop-only">
                    <table className="tickets-table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Category</th>
                          <th>Subject</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTickets.map((t) => {
                          const isExpanded = expandedTicketId === t._id;
                          const dateFormatted = t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Today";

                          return (
                            <React.Fragment key={t._id || t.ticketId}>
                              <tr className="ticket-table-row">
                                <td className="col-ticket-id">
                                  <span className="id-badge">#{t.ticketId}</span>
                                </td>
                                <td className="col-category">
                                  <span className="cat-pill">{t.categoryLabel || t.category}</span>
                                </td>
                                <td className="col-subject">
                                  <div className="subject-line">{t.subject}</div>
                                </td>
                                <td className="col-priority">
                                  <span className={`priority-tag ${(t.priority || "NORMAL").toLowerCase()}`}>
                                    {t.priority || "NORMAL"}
                                  </span>
                                </td>
                                <td className="col-status">
                                  <span className={`status-badge ${(t.status || "OPEN").toLowerCase()}`}>
                                    ● {t.status || "OPEN"}
                                  </span>
                                </td>
                                <td className="col-date">{dateFormatted}</td>
                                <td className="col-action">
                                  <button
                                    type="button"
                                    className="btn-view-details"
                                    onClick={() =>
                                      setExpandedTicketId(isExpanded ? null : t._id)
                                    }
                                  >
                                    {isExpanded ? "Hide" : "Details"}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="ticket-expanded-row">
                                  <td colSpan="7">
                                    <div className="expanded-content">
                                      <div className="expanded-desc">
                                        <strong>Description:</strong>
                                        <p>{t.description}</p>
                                      </div>
                                      <div className="expanded-meta-grid">
                                        <div>
                                          <span>Assigned To:</span> {t.assignedTo || "Kite Helpdesk Team"}
                                        </div>
                                        <div>
                                          <span>SLA Target:</span> {t.slaHours || 2} Business Hours
                                        </div>
                                        <div>
                                          <span>User ID:</span> {t.userId}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Tickets Cards View */}
                  <div className="tickets-mobile-cards-list mobile-only">
                    {userTickets.map((t) => {
                      const isExpanded = expandedTicketId === t._id;
                      const dateFormatted = t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Today";

                      return (
                        <div key={t._id || t.ticketId} className="ticket-mobile-card">
                          <div className="ticket-card-header">
                            <div className="ticket-card-id-row">
                              <span className="id-badge">#{t.ticketId}</span>
                              <span className="cat-pill">{t.categoryLabel || t.category}</span>
                            </div>
                            <span className={`status-badge ${(t.status || "OPEN").toLowerCase()}`}>
                              ● {t.status || "OPEN"}
                            </span>
                          </div>

                          <div className="ticket-card-subject">{t.subject}</div>

                          <div className="ticket-card-footer">
                            <div className="ticket-card-meta-left">
                              <span className="ticket-card-date">{dateFormatted}</span>
                              <span className={`priority-tag ${(t.priority || "NORMAL").toLowerCase()}`}>
                                {t.priority || "NORMAL"}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn-card-details"
                              onClick={() => setExpandedTicketId(isExpanded ? null : t._id)}
                            >
                              {isExpanded ? "Hide" : "Details"}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="ticket-card-expanded">
                              <div className="expanded-desc">
                                <strong>Description:</strong>
                                <p>{t.description}</p>
                              </div>
                              <div className="expanded-meta-grid">
                                <div>
                                  <span>Assigned To:</span> {t.assignedTo || "Kite Helpdesk"}
                                </div>
                                <div>
                                  <span>SLA:</span> {t.slaHours || 2} Business Hours
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 3: USER MANUAL ================= */}
          {activeTab === "MANUAL" && (
            <div className="manual-content-view">
              <div className="manual-section">
                <h4>1. Order Types &amp; Product Codes</h4>
                <div className="manual-grid">
                  <div className="manual-box">
                    <strong>CNC (Cash &amp; Carry)</strong>
                    <span>
                      Delivery investment for Equity. 100% upfront funds required. Shares held in your CDSL Demat account with zero brokerage.
                    </span>
                  </div>
                  <div className="manual-box">
                    <strong>MIS (Margin Intraday Square-off)</strong>
                    <span>
                      Intraday trading with up to 5x leverage. Must be squared off before 15:20 IST or auto-squareoff applies by RMS engines.
                    </span>
                  </div>
                  <div className="manual-box">
                    <strong>NRML (Normal)</strong>
                    <span>
                      Overnight positional trading for Futures &amp; Options contracts held until contract expiry day without intraday square-off.
                    </span>
                  </div>
                  <div className="manual-box">
                    <strong>GTT (Good Till Triggered)</strong>
                    <span>
                      Standing stop-loss and target triggers valid for 1 year. Automatically places exchange orders when market price hits your trigger.
                    </span>
                  </div>
                </div>
              </div>

              <div className="manual-section" style={{ marginTop: "16px" }}>
                <h4>2. SEBI Margin &amp; Peak Margin Framework</h4>
                <p className="manual-desc">
                  Under SEBI regulations, 100% upfront margin is compulsory for equity intraday and derivatives. Peak margin is computed by clearing corporations across 4 intraday snapshots. Sell proceeds are 80% available for trading instantly, and 100% for withdrawal on T+1 day.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="support-modal-footer">
          <span className="support-footer-info">
            Zerodha Support Desk &bull; Mon - Fri 08:30 to 18:00 IST &bull; SEBI Reg: INZ000031633
          </span>
          <button type="button" className="btn-support-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
