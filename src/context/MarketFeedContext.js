import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { initialWatchlist, marketIndices as defaultIndices } from "../data/mockData";

const MarketFeedContext = createContext({
  quotes: {},
  indices: defaultIndices,
  isLive: true,
  toggleLive: () => {},
  getLiveQuote: () => null,
});

export const MarketFeedProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(true);

  // Initialize base quotes from initialWatchlist
  const basePricesRef = useRef({});
  const [quotes, setQuotes] = useState(() => {
    const map = {};
    initialWatchlist.forEach((item) => {
      // derive base price (previous close)
      const base = item.price - (item.change || 0);
      basePricesRef.current[item.symbol] = base > 0 ? base : item.price;
      map[item.symbol] = {
        ...item,
        tickDirection: null,
      };
    });
    return map;
  });

  // Indices state
  const baseNiftyRef = useRef(24466.0); // 24340.60 - (-125.40)
  const baseSensexRef = useRef(80362.35); // 79942.20 - (-420.15)
  const [indices, setIndices] = useState(defaultIndices);

  // Tick generator
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      // Pick 1 to 3 random stocks from quotes to tick
      const symbols = Object.keys(quotes);
      if (symbols.length === 0) return;

      const countToUpdate = Math.floor(Math.random() * 3) + 1;
      const pickedSymbols = [];
      for (let i = 0; i < countToUpdate; i++) {
        const randSym = symbols[Math.floor(Math.random() * symbols.length)];
        if (!pickedSymbols.includes(randSym)) {
          pickedSymbols.push(randSym);
        }
      }

      setQuotes((prev) => {
        const next = { ...prev };
        pickedSymbols.forEach((sym) => {
          const item = prev[sym];
          if (!item) return;

          // Realistic tick: NSE tick size is 0.05
          // Step between -0.4% to +0.4%
          const deltaSteps = Math.floor((Math.random() * 9) - 4); // -4 to +4
          if (deltaSteps === 0) return;

          const tickStep = item.price > 2000 ? 0.5 : item.price > 500 ? 0.1 : 0.05;
          const priceChange = deltaSteps * tickStep;
          const newPrice = Math.max(1, +(item.price + priceChange).toFixed(2));
          const base = basePricesRef.current[sym] || item.price;
          const netChange = +(newPrice - base).toFixed(2);
          const percentVal = +((netChange / base) * 100).toFixed(2);
          const isDown = netChange < 0;
          const percentStr = (netChange >= 0 ? "+" : "") + percentVal.toFixed(2) + "%";
          const tickDir = priceChange > 0 ? "up" : "down";

          next[sym] = {
            ...item,
            price: newPrice,
            change: netChange,
            percent: percentStr,
            isDown,
            tickDirection: tickDir,
          };
        });
        return next;
      });

      // Clear tickDirection after 600ms
      setTimeout(() => {
        setQuotes((prev) => {
          let modified = false;
          const cleaned = { ...prev };
          pickedSymbols.forEach((sym) => {
            if (cleaned[sym] && cleaned[sym].tickDirection) {
              cleaned[sym] = { ...cleaned[sym], tickDirection: null };
              modified = true;
            }
          });
          return modified ? cleaned : prev;
        });
      }, 650);

      // Periodically tick indices (40% chance per interval)
      if (Math.random() < 0.45) {
        setIndices((prev) => {
          return prev.map((idx, index) => {
            const isNifty = idx.name.includes("NIFTY");
            const base = isNifty ? baseNiftyRef.current : baseSensexRef.current;
            const currentVal = parseFloat(idx.value.replace(/,/g, ""));
            const deltaSteps = Math.floor(Math.random() * 7) - 3;
            const pointStep = isNifty ? 1.85 : 5.4;
            const newIndexVal = +(currentVal + deltaSteps * pointStep).toFixed(2);
            const netPointChange = +(newIndexVal - base).toFixed(2);
            const netPct = +((netPointChange / base) * 100).toFixed(2);
            const isDown = netPointChange < 0;
            const tickDir = deltaSteps >= 0 ? "up" : "down";

            return {
              ...idx,
              value: newIndexVal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              change: (netPointChange >= 0 ? "+" : "") + netPointChange.toFixed(2),
              percent: (netPointChange >= 0 ? "+" : "") + netPct.toFixed(2) + "%",
              isDown,
              tickDirection: tickDir,
            };
          });
        });

        setTimeout(() => {
          setIndices((prev) =>
            prev.map((idx) => ({ ...idx, tickDirection: null }))
          );
        }, 650);
      }
    }, 1800);

    return () => clearInterval(timer);
  }, [isLive, quotes]);

  const getLiveQuote = useCallback(
    (symbol) => {
      return quotes[symbol] || null;
    },
    [quotes]
  );

  const registerStocks = useCallback((stocks) => {
    if (!Array.isArray(stocks) || stocks.length === 0) return;
    setQuotes((prev) => {
      let changed = false;
      const next = { ...prev };
      stocks.forEach((item) => {
        if (!item || !item.symbol) return;
        const sym = item.symbol;
        if (!next[sym]) {
          changed = true;
          const price = Number(item.price) || 100;
          const change = Number(item.change) || 0;
          const base = price - change;
          basePricesRef.current[sym] = base > 0 ? base : price;
          next[sym] = {
            ...item,
            price,
            change,
            tickDirection: null,
          };
        }
      });
      return changed ? next : prev;
    });
  }, []);

  return (
    <MarketFeedContext.Provider
      value={{
        quotes,
        indices,
        isLive,
        toggleLive: () => setIsLive((prev) => !prev),
        getLiveQuote,
        registerStocks,
      }}
    >
      {children}
    </MarketFeedContext.Provider>
  );
};

export const useMarketFeed = () => useContext(MarketFeedContext);
export default MarketFeedContext;
