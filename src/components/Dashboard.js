import React from "react";
import { Route, Routes } from "react-router-dom";
import Summary from "./Summary";
import Orders from "./Orders";
import Holdings from "./Holdings";
import Positions from "./Positions";
import BidsPage from "./BidsPage";
import Funds from "./Funds";
import WatchList from "./WatchList";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <WatchList />
      <main className="content">
        <Routes>
          <Route path="/" element={<Summary />} />
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
