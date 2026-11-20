import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomeTourModal.css";

const TOUR_SLIDES = [
  {
    step: 1,
    badge: "1. Market Watchlists",
    icon: "📊",
    title: "Build Your Custom Watchlists",
    description:
      "Search over 100+ equities, indices, and derivatives. Track live tick-by-tick prices across 7 customized tabs with real-time green/red price fluctuations.",
    highlights: ["Real-time NSE/BSE tick feeds", "7 dedicated watchlist tabs", "Instant search & filtering"],
    accentColor: "#387ed1",
  },
  {
    step: 2,
    badge: "2. Charts & Orders",
    icon: "📈",
    title: "Pro Candlestick Charts & Instant Orders",
    description:
      "Tap any stock to open high-DPI TradingView charts with technical overlays (EMA 20, SMA 50, VWAP, RSI) and place instant Buy/Sell orders with 1-tap presets.",
    highlights: ["Multi-interval charts (1m to 1Y)", "Interactive touch crosshair", "Level-2 Market Depth"],
    accentColor: "#26a69a",
  },
  {
    step: 3,
    badge: "3. Portfolio & Positions",
    icon: "💼",
    title: "Live Portfolio & Execution Audit",
    description:
      "Monitor open intraday MIS positions, Demat CNC holdings, and order audit logs in real time. Track live profit & loss with automatic square-off rules.",
    highlights: ["Live unrealized P&L tracker", "Instant position conversion", "Automated GTT triggers"],
    accentColor: "#7e22ce",
  },
  {
    step: 4,
    badge: "4. Instant Margin",
    icon: "⚡",
    title: "Instant Zero-Cost UPI Pay-ins",
    description:
      "Add funds instantly using UPI or Netbanking to activate your margin immediately for equity & F&O trading. Zero brokerage on all equity delivery investments.",
    highlights: ["Instant zero-fee UPI transfer", "24/7 bank payouts", "Demat collateral margin pledging"],
    accentColor: "#16a34a",
  },
];

const WelcomeTourModal = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const slide = TOUR_SLIDES[currentSlide];

  const handleNext = () => {
    if (currentSlide < TOUR_SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem("zerodha_has_seen_tour", "true");
    } catch {}
    onClose();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("zerodha_has_seen_tour", "true");
    } catch {}
    onClose();
  };

  const handleStartWithFunds = () => {
    handleComplete();
    navigate("/funds");
  };

  return (
    <div className="welcome-tour-overlay" onClick={handleSkip}>
      <div className="welcome-tour-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="tour-modal-top">
          <div className="tour-brand-badge">
            <img src="/logo.png" alt="Zerodha Kite" className="tour-kite-logo" />
            <span>Kite Tour</span>
          </div>
          <button
            type="button"
            className="tour-btn-close"
            onClick={handleSkip}
            title="Close Tour"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Carousel Slide Card */}
        <div className="tour-slide-body">
          <div className="tour-icon-bubble" style={{ borderColor: slide.accentColor }}>
            <span className="tour-slide-emoji">{slide.icon}</span>
          </div>

          <span className="tour-slide-badge" style={{ color: slide.accentColor }}>
            {slide.badge}
          </span>

          <h2 className="tour-slide-title">{slide.title}</h2>
          <p className="tour-slide-desc">{slide.description}</p>

          <div className="tour-highlights-tray">
            {slide.highlights.map((h, i) => (
              <span key={i} className="tour-highlight-pill">
                ✓ {h}
              </span>
            ))}
          </div>
        </div>

        {/* Dots Pagination */}
        <div className="tour-dots-row">
          {TOUR_SLIDES.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className={`tour-dot ${idx === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Actions Tray */}
        <div className="tour-modal-footer">
          <button type="button" className="tour-btn-skip" onClick={handleSkip}>
            Skip Tour
          </button>

          <div className="tour-footer-right">
            {currentSlide > 0 && (
              <button type="button" className="tour-btn-prev" onClick={handlePrev}>
                ‹ Back
              </button>
            )}

            {currentSlide < TOUR_SLIDES.length - 1 ? (
              <button type="button" className="tour-btn-next" onClick={handleNext}>
                Next ›
              </button>
            ) : (
              <button type="button" className="tour-btn-finish" onClick={handleStartWithFunds}>
                Add Margin &amp; Trade 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTourModal;
