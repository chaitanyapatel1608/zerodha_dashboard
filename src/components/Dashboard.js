import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Summary from "./Summary";
import Orders from "./Orders";
import Holdings from "./Holdings";
import Positions from "./Positions";
import BidsPage from "./BidsPage";
import Funds from "./Funds";
import WatchList from "./WatchList";
import CandleChart from "./charts/CandleChart";

const Dashboard = () => {
  const location = useLocation();
  const isWatchlistRoute = location.pathname === "/" || location.pathname === "/watchlist";

  return (
    <div className={`dashboard-container ${isWatchlistRoute ? "view-watchlist" : "view-content"}`}>
      <div className={`watchlist-wrapper ${!isWatchlistRoute ? "mobile-hidden" : ""}`}>
        <WatchList />
      </div>

      <main className={`content ${isWatchlistRoute ? "mobile-hidden" : ""}`}>
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
      </main>
    </div>
  );
};

export default Dashboard;
