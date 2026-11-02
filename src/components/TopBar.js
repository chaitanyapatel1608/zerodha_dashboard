import React from "react";
import Menu from "./Menu";
import { marketIndices } from "../data/mockData";

const TopBar = () => {
  return (
    <header className="topbar-container">
      <div className="indices-container">
        {marketIndices.map((idx, index) => (
          <div className="index-item" key={index}>
            <span className="index-name">{idx.name}</span>
            <span className="index-value">{idx.value}</span>
            <span className={`index-change ${idx.isDown ? "down" : "up"}`}>
              {idx.change} ({idx.percent})
            </span>
          </div>
        ))}
      </div>

      <Menu />
    </header>
  );
};

export default TopBar;
