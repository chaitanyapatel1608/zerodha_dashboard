import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const niftyData = {
  labels: ["09:15", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "15:30"],
  prices: [24410, 24450, 24390, 24360, 24380, 24320, 24350, 24340.6],
};

const sensexData = {
  labels: ["09:15", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "15:30"],
  prices: [80200, 80350, 80150, 80020, 80080, 79890, 79980, 79942.2],
};

const MarketOverviewChart = () => {
  const [selectedTab, setSelectedTab] = useState("nifty");

  const currentDataset = selectedTab === "nifty" ? niftyData : sensexData;
  const isDown = true;
  const strokeColor = isDown ? "#df4949" : "#4caf50";
  const fillColor = isDown ? "rgba(223, 73, 73, 0.08)" : "rgba(76, 175, 80, 0.08)";

  const chartData = {
    labels: currentDataset.labels,
    datasets: [
      {
        data: currentDataset.prices,
        borderColor: strokeColor,
        borderWidth: 1.6,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: strokeColor,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        displayColors: false,
        callbacks: {
          label: (context) => ` ₹${context.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#999" },
      },
      y: {
        position: "right",
        grid: { color: "#f0f0f0" },
        ticks: { font: { size: 10 }, color: "#999" },
      },
    },
  };

  return (
    <div className="market-overview-card">
      <div className="overview-header">
        <div className="overview-title-tabs">
          <span className="section-title">Market overview</span>
          <div className="index-selector-tabs">
            <button
              className={`index-tab ${selectedTab === "nifty" ? "active" : ""}`}
              onClick={() => setSelectedTab("nifty")}
            >
              NIFTY 50
            </button>
            <button
              className={`index-tab ${selectedTab === "sensex" ? "active" : ""}`}
              onClick={() => setSelectedTab("sensex")}
            >
              SENSEX
            </button>
          </div>
        </div>
        <div className="current-level">
          <span className="level-val">
            {selectedTab === "nifty" ? "24,340.60" : "79,942.20"}
          </span>
          <span className="level-chg text-down">
            {selectedTab === "nifty" ? "-125.40 (-0.51%)" : "-420.15 (-0.52%)"}
          </span>
        </div>
      </div>

      <div className="overview-chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default MarketOverviewChart;
