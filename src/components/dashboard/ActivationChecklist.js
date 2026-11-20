import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import "./ActivationChecklist.css";

const ActivationChecklist = ({ hasHoldings = false }) => {
  const navigate = useNavigate();
  const { openBuyWindow, openWelcomeTour, currentUser } = useContext(GeneralContext);

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem("zerodha_dismiss_checklist") === "true";
    } catch {
      return false;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("zerodha_collapse_checklist") === "true";
    } catch {
      return false;
    }
  });

  // Track completed quests
  const [completedQuests, setCompletedQuests] = useState(() => {
    try {
      const saved = localStorage.getItem("zerodha_trader_quests");
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        demat: true, // Always true on registration
        watchlist: true, // Auto-seeded or populated
        chart: parsed.chart || false,
        funds: parsed.funds || false,
        trade: parsed.trade || hasHoldings || false,
      };
    } catch {
      return { demat: true, watchlist: true, chart: false, funds: false, trade: hasHoldings || false };
    }
  });

  // If user already holds stocks in their portfolio, mark trade quest complete
  useEffect(() => {
    if (hasHoldings && !completedQuests.trade) {
      updateQuest("trade", true);
    }
  }, [hasHoldings]);

  // Sync state to localStorage
  const updateQuest = (key, value) => {
    setCompletedQuests((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("zerodha_trader_quests", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("zerodha_dismiss_checklist", "true");
    } catch {}
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("zerodha_collapse_checklist", String(next));
      } catch {}
      return next;
    });
  };

  if (isDismissed) return null;

  const totalSteps = 5;
  const completedCount = Object.values(completedQuests).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const isAllComplete = completedCount === totalSteps;

  // Auto-dismiss 5 seconds after reaching 100% completion so the user sees the celebration badge before clean up
  useEffect(() => {
    if (isAllComplete && !isDismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAllComplete, isDismissed]);

  return (
    <div className={`activation-checklist-card ${isCollapsed ? "collapsed" : ""} ${isAllComplete ? "all-done" : ""}`}>
      {/* Header Bar */}
      <div className="checklist-header" onClick={toggleCollapse}>
        <div className="header-left">
          <span className="quest-rocket-icon">{isAllComplete ? "🎉" : "🚀"}</span>
          <div className="header-text-group">
            <h4 className="quest-title">
              {isAllComplete ? "Kite Trader Activated!" : "Get Started with Kite"}
            </h4>
            <span className="quest-progress-subtitle">
              {completedCount} of {totalSteps} tasks completed ({progressPercent}%)
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="quest-progress-track">
            <div
              className="quest-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            className="btn-checklist-toggle"
            title={isCollapsed ? "Expand Checklist" : "Minimize Checklist"}
            aria-label="Toggle"
          >
            {isCollapsed ? "▾" : "▴"}
          </button>

          <button
            type="button"
            className="btn-checklist-dismiss"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            title="Dismiss Checklist"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Expandable Quest List */}
      {!isCollapsed && (
        <div className="checklist-body">
          {/* Quest 1: Demat Account Active */}
          <div className="quest-item completed">
            <div className="quest-status-col">
              <span className="quest-check-bubble">✓</span>
            </div>
            <div className="quest-desc-col">
              <span className="quest-name">Demat Account Active</span>
              <span className="quest-detail">CDSL Depository registered &amp; 2FA TOTP enabled.</span>
            </div>
            <div className="quest-action-col">
              <span className="quest-pill-done">Verified</span>
            </div>
          </div>

          {/* Quest 2: Watchlist Ready */}
          <div className="quest-item completed">
            <div className="quest-status-col">
              <span className="quest-check-bubble">✓</span>
            </div>
            <div className="quest-desc-col">
              <span className="quest-name">Market Watchlist Provisioned</span>
              <span className="quest-detail">NIFTY 50 blue-chips ready with live tick feeds.</span>
            </div>
            <div className="quest-action-col">
              <span className="quest-pill-done">Ready</span>
            </div>
          </div>

          {/* Quest 3: Interactive Candlestick Chart */}
          <div className={`quest-item ${completedQuests.chart ? "completed" : ""}`}>
            <div className="quest-status-col">
              <span className="quest-check-bubble">{completedQuests.chart ? "✓" : "○"}</span>
            </div>
            <div className="quest-desc-col">
              <span className="quest-name">Explore Pro Candlestick Charts</span>
              <span className="quest-detail">Analyze EMA, SMA, VWAP, and RSI technical indicators.</span>
            </div>
            <div className="quest-action-col">
              <button
                type="button"
                className="btn-quest-action"
                onClick={() => {
                  updateQuest("chart", true);
                  navigate("/chart?symbol=RELIANCE");
                }}
              >
                {completedQuests.chart ? "View Again" : "View Chart ›"}
              </button>
            </div>
          </div>

          {/* Quest 4: Add Trading Margin */}
          <div className={`quest-item ${completedQuests.funds ? "completed" : ""}`}>
            <div className="quest-status-col">
              <span className="quest-check-bubble">{completedQuests.funds ? "✓" : "○"}</span>
            </div>
            <div className="quest-desc-col">
              <span className="quest-name">Add Trading Margin</span>
              <span className="quest-detail">Instant UPI / Netbanking deposit with 0% brokerage on delivery.</span>
            </div>
            <div className="quest-action-col">
              <button
                type="button"
                className="btn-quest-action primary"
                onClick={() => {
                  updateQuest("funds", true);
                  navigate("/funds");
                }}
              >
                {completedQuests.funds ? "Manage Funds" : "+ Add Funds"}
              </button>
            </div>
          </div>

          {/* Quest 5: Place First Trade */}
          <div className={`quest-item ${completedQuests.trade ? "completed" : ""}`}>
            <div className="quest-status-col">
              <span className="quest-check-bubble">{completedQuests.trade ? "✓" : "○"}</span>
            </div>
            <div className="quest-desc-col">
              <span className="quest-name">Place Your First Order</span>
              <span className="quest-detail">Execute an intraday MIS or long-term CNC order.</span>
            </div>
            <div className="quest-action-col">
              <button
                type="button"
                className="btn-quest-action"
                onClick={() => {
                  updateQuest("trade", true);
                  if (openBuyWindow) {
                    openBuyWindow("RELIANCE", "BUY", 2712.9);
                  } else {
                    navigate("/");
                  }
                }}
              >
                {completedQuests.trade ? "Order Placed" : "Trade RELIANCE ›"}
              </button>
            </div>
          </div>

          {/* Bottom Bar: Guided Tour Shortcut */}
          <div className="checklist-bottom-helper">
            <span>Need a quick walkthrough?</span>
            <button
              type="button"
              className="btn-replay-tour"
              onClick={() => {
                if (openWelcomeTour) openWelcomeTour();
              }}
            >
              Take 30-Sec Kite Tour &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivationChecklist;
