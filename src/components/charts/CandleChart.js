import React, { useState, useMemo, useContext, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import "./CandleChart.css";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "1D", "1W", "1M", "1Y"];
const CHART_TYPES = [
  { id: "CANDLE", label: "Candles", icon: "🕯️" },
  { id: "LINE", label: "Line", icon: "📈" },
  { id: "AREA", label: "Area", icon: "📉" },
  { id: "HEIKIN_ASHI", label: "Heikin Ashi", icon: "📊" },
];

const CandleChart = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get("symbol") || "INFY";

  const { openBuyWindow, openDepthModal } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();

  // Primary State
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("CANDLE"); // CANDLE | LINE | AREA | HEIKIN_ASHI
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [marketContextTab, setMarketContextTab] = useState("OVERVIEW"); // OVERVIEW | DEPTH

  // Technical Indicators Toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [isIndicatorsMenuOpen, setIsIndicatorsMenuOpen] = useState(false);

  const chartContainerRef = useRef(null);

  const stock = quotes[symbol] || {
    price: 1845.5,
    change: 12.5,
    percent: "+0.68%",
    isDown: false,
  };
  const ltp = Number(stock.price || 1800);

  // Generate realistic OHLC candle data based on symbol, timeframe, and LTP
  const rawCandles = useMemo(() => {
    const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

    let count = 42;
    let deltaMinutes = 5;
    let priceScale = 0.985;

    switch (timeframe) {
      case "1m":
        count = 45;
        deltaMinutes = 1;
        priceScale = 0.996;
        break;
      case "5m":
        count = 42;
        deltaMinutes = 5;
        priceScale = 0.992;
        break;
      case "15m":
        count = 38;
        deltaMinutes = 15;
        priceScale = 0.988;
        break;
      case "1h":
        count = 36;
        deltaMinutes = 60;
        priceScale = 0.98;
        break;
      case "1D":
        count = 42;
        deltaMinutes = 300;
        priceScale = 0.975;
        break;
      case "1W":
        count = 35;
        deltaMinutes = 1440;
        priceScale = 0.95;
        break;
      case "1M":
        count = 30;
        deltaMinutes = 4320;
        priceScale = 0.92;
        break;
      case "1Y":
        count = 48;
        deltaMinutes = 10080;
        priceScale = 0.85;
        break;
      default:
        count = 42;
    }

    const list = [];
    let current = ltp * priceScale;
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const variation = Math.sin((seed + i) * 0.72) * 0.012 + (Math.random() - 0.48) * 0.009;
      const open = +current.toFixed(2);
      const close = isLast ? ltp : +(open * (1 + variation)).toFixed(2);
      const high = +(Math.max(open, close) + Math.abs(Math.sin(i * 1.3)) * (ltp * 0.006)).toFixed(2);
      const low = +(Math.min(open, close) - Math.abs(Math.cos(i * 1.1)) * (ltp * 0.006)).toFixed(2);
      const volume = Math.floor(18000 + ((seed * (i + 1) * 31) % 115000));

      let timeLabel = "";
      const d = new Date(now.getTime() - (count - 1 - i) * deltaMinutes * 60 * 1000);
      if (timeframe === "1m" || timeframe === "5m" || timeframe === "15m" || timeframe === "1h") {
        timeLabel = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      } else if (timeframe === "1D" || timeframe === "1W") {
        timeLabel = d.toLocaleDateString("en-IN", { weekday: "short", hour: "2-digit" });
      } else {
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

  // Compute Heikin-Ashi if selected
  const candles = useMemo(() => {
    if (chartType !== "HEIKIN_ASHI") return rawCandles;
    const haList = [];
    let prevHaOpen = rawCandles[0].open;
    let prevHaClose = rawCandles[0].close;

    for (let i = 0; i < rawCandles.length; i++) {
      const c = rawCandles[i];
      const haClose = +(c.open + c.high + c.low + c.close) / 4;
      const haOpen = i === 0 ? +(c.open + c.close) / 2 : +(prevHaOpen + prevHaClose) / 2;
      const haHigh = Math.max(c.high, haOpen, haClose);
      const haLow = Math.min(c.low, haOpen, haClose);

      haList.push({
        ...c,
        open: +haOpen.toFixed(2),
        high: +haHigh.toFixed(2),
        low: +haLow.toFixed(2),
        close: +haClose.toFixed(2),
        isBullish: haClose >= haOpen,
      });

      prevHaOpen = haOpen;
      prevHaClose = haClose;
    }
    return haList;
  }, [rawCandles, chartType]);

  // Indicator Calculations: EMA 20, SMA 50, VWAP, RSI 14
  const indicators = useMemo(() => {
    const ema20 = [];
    const sma50 = [];
    const vwap = [];
    const rsi14 = [];

    // EMA 20
    const k20 = 2 / (20 + 1);
    let prevEma = candles[0]?.close || 0;
    for (let i = 0; i < candles.length; i++) {
      const price = candles[i].close;
      const currentEma = i === 0 ? price : price * k20 + prevEma * (1 - k20);
      ema20.push(currentEma);
      prevEma = currentEma;
    }

    // SMA 50
    for (let i = 0; i < candles.length; i++) {
      const windowSlice = candles.slice(Math.max(0, i - 14), i + 1);
      const sum = windowSlice.reduce((acc, cur) => acc + cur.close, 0);
      sma50.push(sum / windowSlice.length);
    }

    // VWAP
    let cumVol = 0;
    let cumVolPrice = 0;
    for (let i = 0; i < candles.length; i++) {
      const typ = (candles[i].high + candles[i].low + candles[i].close) / 3;
      cumVol += candles[i].volume;
      cumVolPrice += typ * candles[i].volume;
      vwap.push(cumVolPrice / (cumVol || 1));
    }

    // RSI 14
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        rsi14.push(50);
        continue;
      }
      const change = candles[i].close - candles[i - 1].close;
      const g = change > 0 ? change : 0;
      const l = change < 0 ? Math.abs(change) : 0;

      if (i <= 14) {
        gains += g;
        losses += l;
        if (i === 14) {
          const avgG = gains / 14;
          const avgL = losses / 14;
          const rs = avgG / (avgL || 0.0001);
          rsi14.push(100 - 100 / (1 + rs));
        } else {
          rsi14.push(50);
        }
      } else {
        const prevRsi = rsi14[i - 1] || 50;
        const deltaNorm = (change / (candles[i - 1].close || 1)) * 300;
        const bounded = Math.max(15, Math.min(88, prevRsi + deltaNorm));
        rsi14.push(bounded);
      }
    }

    return { ema20, sma50, vwap, rsi14 };
  }, [candles]);

  // Level-2 Depth and Day Range Analytics
  const { bids, offers, totalBidQty, totalOfferQty, stats } = useMemo(() => {
    const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bidRows = [];
    const offerRows = [];
    let bSum = 0;
    let oSum = 0;

    for (let i = 1; i <= 5; i++) {
      const bPrice = +(ltp - i * 0.2).toFixed(2);
      const bQty = Math.floor(180 + ((seed * i * 37) % 2200));
      const bOrders = Math.floor(1 + ((seed + i) % 8));
      bSum += bQty;
      bidRows.push({ price: bPrice, qty: bQty, orders: bOrders });

      const oPrice = +(ltp + i * 0.2).toFixed(2);
      const oQty = Math.floor(210 + ((seed * i * 43) % 2500));
      const oOrders = Math.floor(1 + ((seed * 2 + i) % 9));
      oSum += oQty;
      offerRows.push({ price: oPrice, qty: oQty, orders: oOrders });
    }

    const openPrice = +(ltp * 0.991).toFixed(2);
    const highPrice = +(ltp * 1.018).toFixed(2);
    const lowPrice = +(ltp * 0.984).toFixed(2);
    const prevClose = +(ltp - (stock.change || 0)).toFixed(2);
    const dayVolume = Math.floor(280000 + ((seed * 850) % 3200000)).toLocaleString("en-IN");
    const lcl = +(ltp * 0.9).toFixed(2);
    const ucl = +(ltp * 1.1).toFixed(2);
    const yearLow = +(ltp * 0.72).toFixed(2);
    const yearHigh = +(ltp * 1.35).toFixed(2);

    return {
      bids: bidRows,
      offers: offerRows,
      totalBidQty: bSum,
      totalOfferQty: oSum,
      stats: { openPrice, highPrice, lowPrice, prevClose, dayVolume, lcl, ucl, yearLow, yearHigh },
    };
  }, [symbol, ltp, stock.change]);

  // Layout Dimensions
  const totalWidth = 920;
  const totalHeight = showRSI ? 550 : 470;
  const yAxisWidth = 80;
  const xAxisHeight = 32;
  const plotWidth = totalWidth - yAxisWidth; // 840

  const rsiPaneHeight = showRSI ? 85 : 0;
  const priceChartHeight = showRSI ? 330 : 400;
  const volChartHeight = 65;
  const volChartBaseline = priceChartHeight;

  // Scale boundaries
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
  const activeCandleIdx = hoveredCandle ? hoveredCandle.id : candles.length - 1;
  const candleSpacing = plotWidth / (candles.length || 1);
  const candleBodyWidth = Math.max(3, candleSpacing * 0.65);

  const getYForPrice = useCallback(
    (p) => {
      const ratio = (p - minPrice) / (maxPrice - minPrice || 1);
      return priceChartHeight - ratio * (priceChartHeight - 25) + 10;
    },
    [minPrice, maxPrice, priceChartHeight]
  );

  const getPriceForY = (y) => {
    const ratio = (priceChartHeight - y + 10) / (priceChartHeight - 25);
    return +(minPrice + ratio * (maxPrice - minPrice)).toFixed(2);
  };

  // Crosshair Interaction Throttled via requestAnimationFrame (Locked 60fps tracking)
  const rafRef = useRef(null);

  const handlePointerMove = (clientX, clientY, currentTarget) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const rect = currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const svgX = (x / rect.width) * totalWidth;
      const svgY = (y / rect.height) * totalHeight;

      if (svgX >= 0 && svgX < plotWidth && svgY >= 0 && svgY < totalHeight) {
        const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(svgX / candleSpacing)));
        setHoveredCandle(candles[idx]);
        setMousePos({
          svgX,
          svgY: Math.min(priceChartHeight, svgY),
          price: getPriceForY(svgY),
          candleTime: candles[idx]?.time,
        });
      } else {
        setHoveredCandle(null);
        setMousePos(null);
      }
    });
  };

  const handleMouseMove = (e) => handlePointerMove(e.clientX, e.clientY, e.currentTarget);
  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    }
  };

  const handlePointerLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setHoveredCandle(null);
    setMousePos(null);
  };

  // Y-axis Price Ticks
  const priceGridLevels = useMemo(() => {
    const count = 5;
    const levels = [];
    for (let i = 0; i <= count; i++) {
      const p = minPrice + (i / count) * (maxPrice - minPrice);
      levels.push({ price: p, y: getYForPrice(p) });
    }
    return levels;
  }, [minPrice, maxPrice, getYForPrice]);

  // X-axis Time Ticks
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(candles.length / 6));
    return candles.filter((_, idx) => idx % step === 0 || idx === candles.length - 1);
  }, [candles]);

  const ltpY = getYForPrice(ltp);

  // Line / Area SVG path generators
  const linePoints = useMemo(() => {
    return candles
      .map((c, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = getYForPrice(c.close);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [candles, candleSpacing, getYForPrice]);

  const areaPoints = useMemo(() => {
    if (!linePoints) return "";
    const firstX = (candleSpacing / 2).toFixed(1);
    const lastX = ((candles.length - 1) * candleSpacing + candleSpacing / 2).toFixed(1);
    return `${firstX},${priceChartHeight} ${linePoints} ${lastX},${priceChartHeight}`;
  }, [linePoints, candles.length, candleSpacing, priceChartHeight]);

  // EMA Path Generator
  const emaPath = useMemo(() => {
    return indicators.ema20
      .map((val, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = getYForPrice(val);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [indicators.ema20, candleSpacing, getYForPrice]);

  // SMA Path Generator
  const smaPath = useMemo(() => {
    return indicators.sma50
      .map((val, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = getYForPrice(val);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [indicators.sma50, candleSpacing, getYForPrice]);

  // VWAP Path Generator
  const vwapPath = useMemo(() => {
    return indicators.vwap
      .map((val, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = getYForPrice(val);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [indicators.vwap, candleSpacing, getYForPrice]);

  // RSI Path Generator
  const rsiPath = useMemo(() => {
    if (!showRSI) return "";
    const rsiTop = priceChartHeight + 25;
    const rsiRange = rsiPaneHeight - 20;
    return indicators.rsi14
      .map((val, idx) => {
        const x = idx * candleSpacing + candleSpacing / 2;
        const y = rsiTop + rsiRange - (val / 100) * rsiRange;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [indicators.rsi14, showRSI, candleSpacing, priceChartHeight, rsiPaneHeight]);

  // Day Range position calculation
  const dayRangePercent = Math.min(
    100,
    Math.max(0, ((ltp - stats.lowPrice) / (stats.highPrice - stats.lowPrice || 1)) * 100)
  );

  const yearRangePercent = Math.min(
    100,
    Math.max(0, ((ltp - stats.yearLow) / (stats.yearHigh - stats.yearLow || 1)) * 100)
  );

  const bidRatio = Math.round((totalBidQty / (totalBidQty + totalOfferQty || 1)) * 100);

  return (
    <div className="candle-chart-view" ref={chartContainerRef}>
      {/* 1. Professional Kite Top Navigation Bar */}
      <header className="candle-chart-header">
        <div className="chart-header-left">
          <button
            type="button"
            className="btn-chart-back"
            onClick={() => navigate(-1)}
            title="Return to Watchlist / Dashboard"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="back-text">Back</span>
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
          {/* Indicators Dropdown Toggle */}
          <div className="chart-controls-dropdown-wrap">
            <button
              type="button"
              className={`btn-chart-indicator-toggle ${isIndicatorsMenuOpen ? "active" : ""}`}
              onClick={() => setIsIndicatorsMenuOpen((prev) => !prev)}
              title="Toggle Technical Indicators"
            >
              <span>Indicators</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isIndicatorsMenuOpen && (
              <div className="indicators-flyout-menu">
                <div className="flyout-title">Technical Overlays</div>
                <label className="indicator-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showEMA20}
                    onChange={(e) => setShowEMA20(e.target.checked)}
                  />
                  <span className="indicator-color-dot ema"></span>
                  <span>EMA (20)</span>
                </label>
                <label className="indicator-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showSMA50}
                    onChange={(e) => setShowSMA50(e.target.checked)}
                  />
                  <span className="indicator-color-dot sma"></span>
                  <span>SMA (50)</span>
                </label>
                <label className="indicator-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showVWAP}
                    onChange={(e) => setShowVWAP(e.target.checked)}
                  />
                  <span className="indicator-color-dot vwap"></span>
                  <span>VWAP</span>
                </label>
                <label className="indicator-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showVolume}
                    onChange={(e) => setShowVolume(e.target.checked)}
                  />
                  <span className="indicator-color-dot vol"></span>
                  <span>Volume Histogram</span>
                </label>
                <hr className="flyout-divider" />
                <div className="flyout-title">Oscillators</div>
                <label className="indicator-checkbox-row">
                  <input
                    type="checkbox"
                    checked={showRSI}
                    onChange={(e) => setShowRSI(e.target.checked)}
                  />
                  <span className="indicator-color-dot rsi"></span>
                  <span>RSI (14) Sub-Pane</span>
                </label>
              </div>
            )}
          </div>

          {/* Chart Style Switcher */}
          <div className="chart-style-switcher desktop-only">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.id}
                type="button"
                className={`chart-style-btn ${chartType === ct.id ? "active" : ""}`}
                onClick={() => setChartType(ct.id)}
                title={ct.label}
              >
                <span>{ct.icon}</span>
              </button>
            ))}
          </div>

          {/* Desktop Buy / Sell / Depth Buttons */}
          <div className="chart-action-buttons desktop-only">
            <button
              type="button"
              className="btn-chart-depth"
              onClick={() => openDepthModal(symbol)}
            >
              ... Depth
            </button>
            <button
              type="button"
              className="btn-chart-buy"
              onClick={() => openBuyWindow(symbol, "BUY", ltp)}
            >
              B
            </button>
            <button
              type="button"
              className="btn-chart-sell"
              onClick={() => openBuyWindow(symbol, "SELL", ltp)}
            >
              S
            </button>
          </div>
        </div>
      </header>

      {/* 2. Interactive Timeframe Ribbon */}
      <div className="timeframe-ribbon-bar">
        <div className="timeframe-scroll-container">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              className={`timeframe-tab-pill ${timeframe === tf ? "active" : ""}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Mobile Chart Type Pills */}
        <div className="mobile-chart-style-tray mobile-only">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.id}
              type="button"
              className={`mobile-type-pill ${chartType === ct.id ? "active" : ""}`}
              onClick={() => setChartType(ct.id)}
              title={ct.label}
            >
              {ct.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Floating High-DPI OHLCV HUD & Indicator Status */}
      <div className="ohlc-info-bar">
        <div className="ohlc-metrics-wrap">
          <span className="ohlc-val time">
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
          {showVolume && (
            <span className="ohlc-val">
              Vol: <strong>{activeCandle.volume?.toLocaleString("en-IN")}</strong>
            </span>
          )}
        </div>

        {/* Indicator Badges */}
        <div className="active-indicators-badges">
          {showEMA20 && (
            <span className="badge-ind ema">
              EMA20: ₹{indicators.ema20[activeCandleIdx]?.toFixed(2)}
            </span>
          )}
          {showSMA50 && (
            <span className="badge-ind sma">
              SMA50: ₹{indicators.sma50[activeCandleIdx]?.toFixed(2)}
            </span>
          )}
          {showVWAP && (
            <span className="badge-ind vwap">
              VWAP: ₹{indicators.vwap[activeCandleIdx]?.toFixed(2)}
            </span>
          )}
          {showRSI && (
            <span className="badge-ind rsi">
              RSI14: {indicators.rsi14[activeCandleIdx]?.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* 4. Candlestick SVG Surface with X and Y Axes */}
      <div
        className="chart-canvas-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerLeave}
      >
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="chart-svg-surface"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#387ed1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#387ed1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="bullVolGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#26a69a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#26a69a" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="bearVolGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef5350" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef5350" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Y-Axis Rail Background */}
          <rect
            x={plotWidth}
            y="0"
            width={yAxisWidth}
            height={priceChartHeight}
            fill="#fafbfc"
          />

          {/* X-Axis Rail Background */}
          <rect
            x="0"
            y={priceChartHeight}
            width={plotWidth}
            height={xAxisHeight}
            fill="#fafbfc"
          />

          {/* Corner Box */}
          <rect
            x={plotWidth}
            y={priceChartHeight}
            width={yAxisWidth}
            height={xAxisHeight}
            fill="#f1f5f9"
          />

          {/* Axis Borders */}
          <line
            x1={plotWidth}
            y1="0"
            x2={plotWidth}
            y2={totalHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <line
            x1="0"
            y1={priceChartHeight}
            x2={totalWidth}
            y2={priceChartHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />

          {/* Y-AXIS PRICE LABELS & HORIZONTAL GRID */}
          {priceGridLevels.map((lvl, idx) => (
            <g key={`ygrid-${idx}`}>
              <line
                x1="0"
                y1={lvl.y}
                x2={plotWidth}
                y2={lvl.y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <line
                x1={plotWidth}
                y1={lvl.y}
                x2={plotWidth + 4}
                y2={lvl.y}
                stroke="#cbd5e0"
                strokeWidth="1"
              />
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

          {/* X-AXIS TIME LABELS & VERTICAL GRID */}
          {xTicks.map((c) => {
            const x = c.id * candleSpacing + candleSpacing / 2;
            return (
              <g key={`xtick-${c.id}`}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={priceChartHeight}
                  stroke="#f8fafc"
                  strokeWidth="1"
                />
                <line
                  x1={x}
                  y1={priceChartHeight}
                  x2={x}
                  y2={priceChartHeight + 4}
                  stroke="#cbd5e0"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={priceChartHeight + 18}
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

          {/* VOLUME HISTOGRAM BARS */}
          {showVolume &&
            candles.map((c, idx) => {
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
                  fill={c.isBullish ? "url(#bullVolGradient)" : "url(#bearVolGradient)"}
                  rx="1"
                />
              );
            })}

          {/* AREA CHART MODE */}
          {chartType === "AREA" && (
            <polygon points={areaPoints} fill="url(#areaGradient)" />
          )}

          {/* LINE / AREA STROKE */}
          {(chartType === "LINE" || chartType === "AREA") && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#387ed1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* CANDLESTICKS OR HEIKIN ASHI */}
          {(chartType === "CANDLE" || chartType === "HEIKIN_ASHI") &&
            candles.map((c, idx) => {
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
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
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

          {/* TECHNICAL OVERLAYS: EMA 20 */}
          {showEMA20 && (
            <path
              d={emaPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* TECHNICAL OVERLAYS: SMA 50 */}
          {showSMA50 && (
            <path
              d={smaPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* TECHNICAL OVERLAYS: VWAP */}
          {showVWAP && (
            <path
              d={vwapPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1.8"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />
          )}

          {/* SUB-PANE: RSI (14) OSCILLATOR */}
          {showRSI && (
            <g transform={`translate(0, ${priceChartHeight + xAxisHeight + 10})`}>
              <rect
                x="0"
                y="0"
                width={plotWidth}
                height={rsiPaneHeight}
                fill="#f8fafc"
                stroke="#e2e8f0"
              />
              <line
                x1="0"
                y1={rsiPaneHeight * 0.3}
                x2={plotWidth}
                y2={rsiPaneHeight * 0.3}
                stroke="#fca5a5"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={rsiPaneHeight * 0.7}
                x2={plotWidth}
                y2={rsiPaneHeight * 0.7}
                stroke="#86efac"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1={rsiPaneHeight * 0.5}
                x2={plotWidth}
                y2={rsiPaneHeight * 0.5}
                stroke="#cbd5e1"
                strokeDasharray="2 2"
              />
              <text x={plotWidth + 8} y="22" fill="#64748b" fontSize="9" fontWeight="600">
                70 OB
              </text>
              <text x={plotWidth + 8} y="62" fill="#64748b" fontSize="9" fontWeight="600">
                30 OS
              </text>
              <path
                d={rsiPath}
                fill="none"
                stroke="#ec4899"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* LIVE LTP TRACKER BADGE ON Y-AXIS */}
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

          {/* INTERACTIVE CROSSHAIR & HOVER PILLS */}
          {mousePos && (
            <g>
              <line
                x1={mousePos.svgX}
                y1="0"
                x2={mousePos.svgX}
                y2={priceChartHeight}
                className="chart-crosshair-line"
              />
              <line
                x1="0"
                y1={mousePos.svgY}
                x2={plotWidth}
                y2={mousePos.svgY}
                className="chart-crosshair-line"
              />

              {/* Time Badge on X-Axis */}
              <g transform={`translate(${mousePos.svgX - 35}, ${priceChartHeight})`}>
                <rect x="0" y="0" width="70" height="20" fill="#0f172a" rx="2" />
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

              {/* Price Badge on Y-Axis */}
              <g transform={`translate(${plotWidth}, ${mousePos.svgY - 9})`}>
                <rect x="0" y="0" width={yAxisWidth} height="18" fill="#0f172a" rx="2" />
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

      {/* 5. Market Context Drawer / Accordion */}
      <section className="chart-market-accordion">
        {/* Sub-Tabs: Overview vs Order Depth */}
        <div className="accordion-tab-bar">
          <button
            type="button"
            className={`accordion-tab-btn ${marketContextTab === "OVERVIEW" ? "active" : ""}`}
            onClick={() => setMarketContextTab("OVERVIEW")}
          >
            📊 Market Performance &amp; Stats
          </button>
          <button
            type="button"
            className={`accordion-tab-btn ${marketContextTab === "DEPTH" ? "active" : ""}`}
            onClick={() => setMarketContextTab("DEPTH")}
          >
            📑 Level-2 Order Depth (5x5)
          </button>
        </div>

        {marketContextTab === "OVERVIEW" ? (
          <div className="market-overview-pane">
            {/* Today's Low / High Range Slider */}
            <div className="range-meter-card">
              <div className="range-label-row">
                <span className="range-title">Today's Range</span>
                <span className="range-ltp-pill">LTP: ₹{ltp.toFixed(2)}</span>
              </div>
              <div className="range-slider-track">
                <div
                  className="range-slider-pin"
                  style={{ left: `${dayRangePercent}%` }}
                >
                  <span className="pin-triangle">▼</span>
                </div>
              </div>
              <div className="range-bounds-row">
                <div className="bound-col left">
                  <span className="bound-label">Low</span>
                  <span className="bound-val font-mono">₹{stats.lowPrice.toFixed(2)}</span>
                </div>
                <div className="bound-col right">
                  <span className="bound-label">High</span>
                  <span className="bound-val font-mono">₹{stats.highPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 52-Week Range Slider */}
            <div className="range-meter-card">
              <div className="range-label-row">
                <span className="range-title">52-Week Range</span>
                <span className="range-tag">All-time High/Low</span>
              </div>
              <div className="range-slider-track year-range">
                <div
                  className="range-slider-pin"
                  style={{ left: `${yearRangePercent}%` }}
                >
                  <span className="pin-triangle">▼</span>
                </div>
              </div>
              <div className="range-bounds-row">
                <div className="bound-col left">
                  <span className="bound-label">52W Low</span>
                  <span className="bound-val font-mono">₹{stats.yearLow.toFixed(2)}</span>
                </div>
                <div className="bound-col right">
                  <span className="bound-label">52W High</span>
                  <span className="bound-val font-mono">₹{stats.yearHigh.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Trading Key Statistics Grid */}
            <div className="market-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Open</span>
                <span className="stat-val font-mono">₹{stats.openPrice.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Prev. Close</span>
                <span className="stat-val font-mono">₹{stats.prevClose.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Volume</span>
                <span className="stat-val font-mono">{stats.dayVolume}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Lower Circuit (10%)</span>
                <span className="stat-val font-mono text-down">₹{stats.lcl.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Upper Circuit (10%)</span>
                <span className="stat-val font-mono text-up">₹{stats.ucl.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg. Traded Price</span>
                <span className="stat-val font-mono">
                  ₹{indicators.vwap[indicators.vwap.length - 1]?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="market-depth-pane">
            <div className="depth-ratio-bar-wrap">
              <div className="ratio-labels">
                <span className="text-up font-bold">Bids: {bidRatio}% ({totalBidQty.toLocaleString()})</span>
                <span className="text-down font-bold">Offers: {100 - bidRatio}% ({totalOfferQty.toLocaleString()})</span>
              </div>
              <div className="ratio-track">
                <div className="ratio-fill-bid" style={{ width: `${bidRatio}%` }}></div>
                <div className="ratio-fill-offer" style={{ width: `${100 - bidRatio}%` }}></div>
              </div>
            </div>

            <div className="depth-tables-split">
              {/* Bids Table */}
              <div className="depth-side bids">
                <div className="depth-side-title">Bid Order Book</div>
                <table className="depth-table">
                  <thead>
                    <tr>
                      <th>Orders</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b, i) => (
                      <tr key={`b-${i}`}>
                        <td className="text-muted">{b.orders}</td>
                        <td className="font-mono">{b.qty}</td>
                        <td className="font-mono text-up font-bold">₹{b.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Offers Table */}
              <div className="depth-side offers">
                <div className="depth-side-title">Offer Order Book</div>
                <table className="depth-table">
                  <thead>
                    <tr>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o, i) => (
                      <tr key={`o-${i}`}>
                        <td className="font-mono text-down font-bold">₹{o.price.toFixed(2)}</td>
                        <td className="font-mono">{o.qty}</td>
                        <td className="text-muted">{o.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. Pinned Bottom Order Execution Tray (Mobile 50/50 Touch Dock) */}
      <div className="mobile-chart-execution-dock mobile-only">
        <button
          type="button"
          className="btn-dock-buy"
          onClick={() => openBuyWindow(symbol, "BUY", ltp)}
        >
          <span className="dock-action-text">BUY</span>
          <span className="dock-price-text">₹{ltp.toFixed(2)}</span>
        </button>
        <button
          type="button"
          className="btn-dock-sell"
          onClick={() => openBuyWindow(symbol, "SELL", ltp)}
        >
          <span className="dock-action-text">SELL</span>
          <span className="dock-price-text">₹{ltp.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};

export default CandleChart;
