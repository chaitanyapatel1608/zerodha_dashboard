import React, { useState, useMemo, useContext, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import "./CandleChart.css";

const CandleChart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get("symbol") || "INFY";

  const { openBuyWindow, openDepthModal } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();

  const [timeframe, setTimeframe] = useState("1D");
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const stock = quotes[symbol] || {
    price: 1845.50,
    change: 12.50,
    percent: "+0.68%",
    isDown: false,
  };
  const ltp = Number(stock.price || 1800);

  // Layout Dimensions for clean axes separation
  const totalWidth = 920;
  const totalHeight = 480;
  const yAxisWidth = 80;
  const xAxisHeight = 35;
  const plotWidth = totalWidth - yAxisWidth; // 840
  const plotHeight = totalHeight - xAxisHeight; // 445
  const priceChartHeight = plotHeight * 0.74; // 330
  const volChartHeight = plotHeight * 0.20; // 89
  const volChartBaseline = plotHeight; // 445

  // Generate realistic OHLC candle data based on symbol, timeframe, and LTP
  const candles = useMemo(() => {
    const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const count = timeframe === "1D" ? 42 : timeframe === "1W" ? 35 : timeframe === "1M" ? 28 : 48;
    const list = [];
    let current = ltp * (timeframe === "1D" ? 0.985 : timeframe === "1W" ? 0.95 : 0.88);
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const variation = Math.sin((seed + i) * 0.75) * 0.015 + (Math.random() - 0.48) * 0.012;
      const open = +current.toFixed(2);
      const close = isLast ? ltp : +(open * (1 + variation)).toFixed(2);
      const high = +(Math.max(open, close) + Math.abs(Math.sin(i * 1.3)) * (ltp * 0.008)).toFixed(2);
      const low = +(Math.min(open, close) - Math.abs(Math.cos(i * 1.1)) * (ltp * 0.008)).toFixed(2);
      const volume = Math.floor(15000 + ((seed * (i + 1) * 31) % 95000));

      let timeLabel = "";
      if (timeframe === "1D") {
        const d = new Date(now.getTime() - (count - 1 - i) * 5 * 60 * 1000);
        timeLabel = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      } else if (timeframe === "1W") {
        const d = new Date(now.getTime() - (count - 1 - i) * 3600 * 1000);
        timeLabel = d.toLocaleDateString("en-IN", { weekday: "short", hour: "2-digit" });
      } else {
        const d = new Date(now.getTime() - (count - 1 - i) * 24 * 3600 * 1000);
        timeLabel = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      }

      list.push({
        id: i,
        time: timeLabel,
        open,
        high,
        low,
        close,
        volume,
        isBullish: close >= open,
      });

      current = close;
    }

    return list;
  }, [symbol, timeframe, ltp]);

  // Compute scale boundaries
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    let minP = Infinity;
    let maxP = -Infinity;
    let maxV = 0;
    candles.forEach((c) => {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (c.volume > maxV) maxV = c.volume;
    });
    const padding = (maxP - minP) * 0.08 || 1;
    return {
      minPrice: minP - padding,
      maxPrice: maxP + padding,
      maxVol: maxV || 1,
    };
  }, [candles]);

  const activeCandle = hoveredCandle || candles[candles.length - 1] || {};

  const candleSpacing = plotWidth / (candles.length || 1);
  const candleBodyWidth = Math.max(3, candleSpacing * 0.65);

  const getYForPrice = useCallback((p) => {
    const ratio = (p - minPrice) / (maxPrice - minPrice || 1);
    return priceChartHeight - ratio * priceChartHeight + 15;
  }, [minPrice, maxPrice, priceChartHeight]);

  const getPriceForY = (y) => {
    const ratio = (priceChartHeight - y + 15) / priceChartHeight;
    return +(minPrice + ratio * (maxPrice - minPrice)).toFixed(2);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * totalWidth;
    const svgY = (y / rect.height) * totalHeight;

    if (svgX < plotWidth && svgY < plotHeight) {
      const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(svgX / candleSpacing)));
      setHoveredCandle(candles[idx]);
      setMousePos({
        svgX,
        svgY,
        price: getPriceForY(svgY),
        candleTime: candles[idx]?.time,
      });
    } else {
      setHoveredCandle(null);
      setMousePos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };

  // Y-axis Price Ticks (5 evenly-spaced levels)
  const priceGridLevels = useMemo(() => {
    const count = 5;
    const levels = [];
    for (let i = 0; i <= count; i++) {
      const p = minPrice + (i / count) * (maxPrice - minPrice);
      levels.push({
        price: p,
        y: getYForPrice(p),
      });
    }
    return levels;
  }, [minPrice, maxPrice, getYForPrice]);

  // X-axis Time/Date Ticks (6 evenly-spaced labels)
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(candles.length / 6));
    return candles.filter((_, idx) => idx % step === 0 || idx === candles.length - 1);
  }, [candles]);

  const ltpY = getYForPrice(ltp);

  return (
    <div className="candle-chart-view">
      {/* Top Header */}
      <div className="candle-chart-header">
        <div className="chart-header-left">
          <button className="btn-chart-back" onClick={() => navigate(-1)} title="Go back">
            &larr; Back
          </button>
          <div className="chart-symbol-info">
            <span className="chart-symbol-title">{symbol}</span>
            <span className="chart-exchange-tag">NSE</span>
            <span className={`chart-ltp-display ${stock.isDown ? "text-down" : "text-up"}`}>
              ₹{ltp.toFixed(2)}{" "}
              <small>({stock.percent || "0.00%"})</small>
            </span>
          </div>
        </div>

        <div className="chart-header-right">
          {/* Timeframe Selector */}
          <div className="timeframe-group">
            {["1D", "1W", "1M", "1Y"].map((tf) => (
              <button
                key={tf}
                className={`timeframe-pill ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="chart-action-buttons">
            <button
              className="btn-chart-depth"
              onClick={() => openDepthModal(symbol)}
            >
              ... Depth
            </button>
            <button
              className="btn-chart-buy"
              onClick={() => openBuyWindow(symbol, "BUY", ltp)}
            >
              B
            </button>
            <button
              className="btn-chart-sell"
              onClick={() => openBuyWindow(symbol, "SELL", ltp)}
            >
              S
            </button>
          </div>
        </div>
      </div>

      {/* OHLC Bar */}
      <div className="ohlc-info-bar">
        <span className="ohlc-val">
          Time: <strong>{activeCandle.time || "--"}</strong>
        </span>
        <span className="ohlc-val">
          O: <strong>₹{activeCandle.open?.toFixed(2)}</strong>
        </span>
        <span className="ohlc-val">
          H: <strong className="text-up">₹{activeCandle.high?.toFixed(2)}</strong>
        </span>
        <span className="ohlc-val">
          L: <strong className="text-down">₹{activeCandle.low?.toFixed(2)}</strong>
        </span>
        <span className="ohlc-val">
          C: <strong>₹{activeCandle.close?.toFixed(2)}</strong>
        </span>
        <span className="ohlc-val">
          Vol: <strong>{activeCandle.volume?.toLocaleString("en-IN")}</strong>
        </span>
      </div>

      {/* Candlestick SVG Surface with X and Y Axes */}
      <div
        className="chart-canvas-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="chart-svg-surface"
          preserveAspectRatio="none"
        >
          {/* ============================================================ */}
          {/* AXIS RAILS BACKGROUND & BORDERS */}
          {/* ============================================================ */}
          {/* Y-Axis Rail Background */}
          <rect
            x={plotWidth}
            y="0"
            width={yAxisWidth}
            height={plotHeight}
            fill="#fafbfc"
          />

          {/* X-Axis Rail Background */}
          <rect
            x="0"
            y={plotHeight}
            width={plotWidth}
            height={xAxisHeight}
            fill="#fafbfc"
          />

          {/* Corner Box (Intersection of X and Y Axes) */}
          <rect
            x={plotWidth}
            y={plotHeight}
            width={yAxisWidth}
            height={xAxisHeight}
            fill="#f1f5f9"
          />

          {/* Y-Axis Vertical Border */}
          <line
            x1={plotWidth}
            y1="0"
            x2={plotWidth}
            y2={totalHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />

          {/* X-Axis Horizontal Border */}
          <line
            x1="0"
            y1={plotHeight}
            x2={totalWidth}
            y2={plotHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />

          {/* ============================================================ */}
          {/* Y-AXIS PRICE LABELS & HORIZONTAL GRID LINES */}
          {/* ============================================================ */}
          {priceGridLevels.map((lvl, idx) => (
            <g key={`ygrid-${idx}`}>
              {/* Plot Horizontal Grid Line */}
              <line
                x1="0"
                y1={lvl.y}
                x2={plotWidth}
                y2={lvl.y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              {/* Y-Axis Tick Mark */}
              <line
                x1={plotWidth}
                y1={lvl.y}
                x2={plotWidth + 4}
                y2={lvl.y}
                stroke="#cbd5e0"
                strokeWidth="1"
              />
              {/* Y-Axis Price Label */}
              <text
                x={plotWidth + 8}
                y={lvl.y + 3.5}
                textAnchor="start"
                fontSize="10"
                fontWeight="500"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                ₹{lvl.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* ============================================================ */}
          {/* X-AXIS TIME/DATE LABELS & VERTICAL TICKS */}
          {/* ============================================================ */}
          {xTicks.map((c) => {
            const x = c.id * candleSpacing + candleSpacing / 2;
            return (
              <g key={`xtick-${c.id}`}>
                {/* Vertical Grid Line into plot */}
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={plotHeight}
                  stroke="#f8fafc"
                  strokeWidth="1"
                />
                {/* X-Axis Tick Mark */}
                <line
                  x1={x}
                  y1={plotHeight}
                  x2={x}
                  y2={plotHeight + 4}
                  stroke="#cbd5e0"
                  strokeWidth="1"
                />
                {/* X-Axis Time Label */}
                <text
                  x={x}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  {c.time}
                </text>
              </g>
            );
          })}

          {/* ============================================================ */}
          {/* VOLUME HISTOGRAM BARS */}
          {/* ============================================================ */}
          {candles.map((c, idx) => {
            const x = idx * candleSpacing + candleSpacing / 2;
            const barHeight = (c.volume / maxVol) * volChartHeight;
            const y = volChartBaseline - barHeight;
            return (
              <rect
                key={`vol-${idx}`}
                x={x - candleBodyWidth / 2}
                y={y}
                width={candleBodyWidth}
                height={barHeight}
                fill={c.isBullish ? "rgba(38, 166, 154, 0.25)" : "rgba(239, 83, 80, 0.25)"}
              />
            );
          })}

          {/* ============================================================ */}
          {/* CANDLESTICKS (WICKS + BODIES) */}
          {/* ============================================================ */}
          {candles.map((c, idx) => {
            const x = idx * candleSpacing + candleSpacing / 2;
            const yHigh = getYForPrice(c.high);
            const yLow = getYForPrice(c.low);
            const yOpen = getYForPrice(c.open);
            const yClose = getYForPrice(c.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
            const color = c.isBullish ? "#26a69a" : "#ef5350";

            return (
              <g key={`candle-${idx}`}>
                {/* High/Low Wick Line */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Candle Body */}
                <rect
                  x={x - candleBodyWidth / 2}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth="1"
                  rx="1"
                />
              </g>
            );
          })}

          {/* ============================================================ */}
          {/* LIVE CURRENT LTP TRACKER BADGE ON Y-AXIS */}
          {/* ============================================================ */}
          <line
            x1="0"
            y1={ltpY}
            x2={plotWidth}
            y2={ltpY}
            stroke={stock.isDown ? "#ef5350" : "#26a69a"}
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <g transform={`translate(${plotWidth}, ${ltpY - 9})`}>
            <rect
              x="0"
              y="0"
              width={yAxisWidth}
              height="18"
              fill={stock.isDown ? "#ef5350" : "#26a69a"}
              rx="2"
            />
            <text
              x={yAxisWidth / 2}
              y="12.5"
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#ffffff"
              fontFamily="sans-serif"
            >
              ₹{ltp.toFixed(2)}
            </text>
          </g>

          {/* ============================================================ */}
          {/* INTERACTIVE CROSSHAIR & HOVER PILLS */}
          {/* ============================================================ */}
          {mousePos && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={mousePos.svgX}
                y1="0"
                x2={mousePos.svgX}
                y2={plotHeight}
                className="chart-crosshair-line"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1="0"
                y1={mousePos.svgY}
                x2={plotWidth}
                y2={mousePos.svgY}
                className="chart-crosshair-line"
              />

              {/* Floating Pill on X-Axis for Hovered Date/Time */}
              <g transform={`translate(${mousePos.svgX - 35}, ${plotHeight})`}>
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="20"
                  fill="#1e293b"
                  rx="2"
                />
                <text
                  x="35"
                  y="13.5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#ffffff"
                  fontFamily="sans-serif"
                >
                  {mousePos.candleTime}
                </text>
              </g>

              {/* Floating Pill on Y-Axis for Hovered Price */}
              <g transform={`translate(${plotWidth}, ${mousePos.svgY - 9})`}>
                <rect
                  x="0"
                  y="0"
                  width={yAxisWidth}
                  height="18"
                  fill="#1e293b"
                  rx="2"
                />
                <text
                  x={yAxisWidth / 2}
                  y="12.5"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#ffffff"
                  fontFamily="sans-serif"
                >
                  ₹{mousePos.price.toFixed(2)}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default CandleChart;
