import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import WatchList from "./WatchList";

const Summary = lazy(() => import("./Summary"));
const Orders = lazy(() => import("./Orders"));
const Holdings = lazy(() => import("./Holdings"));
const Positions = lazy(() => import("./Positions"));
const BidsPage = lazy(() => import("./BidsPage"));
const Funds = lazy(() => import("./Funds"));
const CandleChart = lazy(() => import("./charts/CandleChart"));

const Dashboard = () => {
  const location = useLocation();
  const isWatchlistRoute = location.pathname === "/" || location.pathname === "/watchlist";

  return (
    <div className={`dashboard-container ${isWatchlistRoute ? "view-watchlist" : "view-content"}`}>
      <div className={`watchlist-wrapper ${!isWatchlistRoute ? "mobile-hidden" : ""}`}>
        <WatchList />
      </div>

      <main className={`content ${isWatchlistRoute ? "mobile-hidden" : ""}`}>
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
            <Route path="*" element={<Summary />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;
