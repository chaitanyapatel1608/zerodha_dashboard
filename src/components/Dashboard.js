import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import WatchList from "./WatchList";

const Summary = lazy(() => import("./Summary"));
const Orders = lazy(() => import("./Orders"));
const Holdings = lazy(() => import("./Holdings"));
const Positions = lazy(() => import("./Positions"));
const BidsPage = lazy(() => import("./BidsPage"));
const Funds = lazy(() => import("./Funds"));
const CandleChart = lazy(() => import("./charts/CandleChart"));
const NotFound = lazy(() => import("./NotFound"));

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeOrWatchlist = location.pathname === "/" || location.pathname === "/watchlist";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isWatchlistGroup = isHomeOrWatchlist || isDashboardRoute;

  // On mobile: show watchlist when on root "/" or "/watchlist"; show content when on "/dashboard" or other subpages
  const showWatchlistOnMobile = isHomeOrWatchlist;

  return (
    <div className={`dashboard-container ${showWatchlistOnMobile ? "view-watchlist" : "view-content"}`}>
      {/* Mobile-Only Segmented Pill Switcher (Guaranteed Hidden on Desktop PC > 768px) */}
      {isWatchlistGroup && (
        <div className="mobile-view-segmented-bar" role="tablist" aria-label="Mobile View Switcher">
          <button
            type="button"
            role="tab"
            aria-selected={!isDashboardRoute}
            className={`mobile-view-pill ${!isDashboardRoute ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "6px" }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Watchlist</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isDashboardRoute}
            className={`mobile-view-pill ${isDashboardRoute ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "6px" }}>
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span>Dashboard</span>
          </button>
        </div>
      )}

      <div className={`watchlist-wrapper ${!showWatchlistOnMobile ? "mobile-hidden" : ""}`}>
        <WatchList />
      </div>

      <main className={`content ${showWatchlistOnMobile ? "mobile-hidden" : ""}`}>
        <Suspense fallback={<div style={{ padding: "24px", color: "#64748b", fontSize: "13px" }}>Loading workspace...</div>}>
          <Routes>
            <Route path="/" element={<Summary />} />
            <Route path="/watchlist" element={<Summary />} />
            <Route path="/dashboard" element={<Summary />} />
            <Route path="/chart" element={<CandleChart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/bids" element={<BidsPage />} />
            <Route path="/apps" element={<BidsPage />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;
