import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import GeneralContext from "../GeneralContext";
import { useMarketFeed } from "../../context/MarketFeedContext";
import "./BasketModal.css";

const API_BASE = "http://localhost:3002";

const BasketModal = ({ basket = null, onClose }) => {
  const { showToast, refreshPortfolio, currentUser } = useContext(GeneralContext);
  const { quotes } = useMarketFeed();

  const [basketId, setBasketId] = useState(basket?._id || null);
  const [basketName, setBasketName] = useState(basket?.name || (basket ? "Order Basket" : "New Basket"));
  const [items, setItems] = useState(
    basket?.items && Array.isArray(basket.items)
      ? basket.items.map((it, idx) => ({
          id: it._id || Date.now() + idx,
          symbol: it.symbol,
          mode: it.mode || "BUY",
          product: it.product || "CNC",
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 100,
        }))
      : []
  );

  const [masterCatalog, setMasterCatalog] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load 100+ Master Instruments for search
  useEffect(() => {
    axios
      .get(`${API_BASE}/masterInstruments`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMasterCatalog(res.data);
        }
      })
      .catch((err) => {
        console.warn("Unable to fetch master instruments, fallback:", err.message);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Search filtered options across 100+ universe
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return masterCatalog
      .filter((s) => s.symbol.toLowerCase().includes(term) || (s.name && s.name.toLowerCase().includes(term)))
      .slice(0, 8);
  }, [searchTerm, masterCatalog]);

  const handleAddStock = (stock) => {
    const livePrice = quotes[stock.symbol]?.price || stock.price || 1000;
    const newItem = {
      id: Date.now() + Math.random(),
      symbol: stock.symbol,
      mode: "BUY",
      product: "CNC",
      qty: 1,
      price: Number(livePrice.toFixed(2)),
    };
    setItems((prev) => [...prev, newItem]);
    setSearchTerm("");
    setIsSearchOpen(false);
    showToast("Added to Basket", `${stock.symbol} added to ${basketName}`, "success");
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClear = () => {
    setItems([]);
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Required margin calculation
  const totalMarginRequired = useMemo(() => {
    return items.reduce((sum, item) => {
      const cost = Number(item.qty || 0) * Number(item.price || 0);
      const margin = item.product === "MIS" ? cost * 0.2 : cost;
      return sum + margin;
    }, 0);
  }, [items]);

  // Save or Update Basket in MongoDB Atlas
  const handleSaveBasket = async (shouldClose = true) => {
    if (!basketName.trim()) {
      showToast("Validation Error", "Please provide a name for this basket.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: basketId,
        userId: currentUser?.userId,
        name: basketName.trim(),
        items: items.map((i) => ({
          symbol: i.symbol,
          mode: i.mode || "BUY",
          product: i.product || "CNC",
          qty: Number(i.qty) || 1,
          price: Number(i.price) || 0,
        })),
      };

      const res = await axios.post(`${API_BASE}/saveBasket`, payload);
      if (res.data?.success) {
        if (res.data.basket?._id) {
          setBasketId(res.data.basket._id);
        }
        showToast("Basket Saved", `"${basketName}" successfully saved to your Demat profile.`, "success");
        refreshPortfolio();
        if (shouldClose) {
          onClose();
        }
      }
    } catch (err) {
      showToast("Save Failed", err.response?.data?.message || err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Execute all constituent legs concurrently
  const handleExecuteBasket = async () => {
    if (items.length === 0) return;

    setIsExecuting(true);
    try {
      // First save basket state so changes are persisted without closing modal early
      await handleSaveBasket(false);

      const payload = {
        userId: currentUser?.userId,
        basketName: basketName.trim() || "Order Basket",
        items: items.map((i) => ({
          symbol: i.symbol,
          mode: i.mode || "BUY",
          product: i.product || "CNC",
          qty: Number(i.qty),
          price: Number(i.price),
        })),
      };

      const res = await axios.post(`${API_BASE}/executeBasket`, payload);
      if (res.data?.success) {
        showToast(
          "Basket Executed Successfully",
          `All ${res.data.executedCount} orders in "${basketName}" executed instantly at NSE!`,
          "success"
        );
        refreshPortfolio();
        onClose();
      }
    } catch (err) {
      showToast(
        "Basket Execution Failed",
        err.response?.data?.message || err.message,
        "error"
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="basket-modal-overlay" onClick={onClose}>
      <div className="basket-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="basket-modal-header">
          <div className="basket-title-group">
            <svg
              className="basket-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <input
              type="text"
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
              className="basket-name-input"
              title="Click to rename basket"
              placeholder="Enter basket name..."
            />
            <span className="basket-item-count">({items.length} items)</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Search Bar (100+ Master Instruments) */}
        <div className="basket-search-wrap">
          <input
            type="text"
            placeholder="Search 100+ stocks to add (e.g. infy, reliance, tcs, zomato, mazdock)..."
            value={searchTerm}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
            }}
            className="basket-search-input"
          />

          {isSearchOpen && searchResults.length > 0 && (
            <div className="basket-search-dropdown">
              {searchResults.map((stock) => {
                const liveP = quotes[stock.symbol]?.price || stock.price || 0;
                return (
                  <div
                    key={stock.symbol}
                    className="basket-search-option"
                    onClick={() => handleAddStock(stock)}
                  >
                    <div>
                      <span className="search-option-sym">{stock.symbol}</span>
                      <small style={{ color: "#888", marginLeft: "8px" }}>{stock.name}</small>
                    </div>
                    <span className="search-option-price">₹{Number(liveP).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="basket-items-list">
          {items.length === 0 ? (
            <div className="basket-empty-state">
              <p>Your basket is currently empty.</p>
              <small>Search above to add instruments to this order basket.</small>
            </div>
          ) : (
            <table className="basket-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="item-symbol">{item.symbol}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${item.mode.toLowerCase()}`}
                        style={{ border: "none", cursor: "pointer" }}
                        onClick={() =>
                          handleItemChange(
                            item.id,
                            "mode",
                            item.mode === "BUY" ? "SELL" : "BUY"
                          )
                        }
                      >
                        {item.mode}
                      </button>
                    </td>
                    <td>
                      <select
                        value={item.product || "CNC"}
                        onChange={(e) => handleItemChange(item.id, "product", e.target.value)}
                        style={{
                          fontSize: "11px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                          padding: "2px 4px",
                        }}
                      >
                        <option value="CNC">CNC</option>
                        <option value="MIS">MIS (5x)</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(item.id, "qty", Math.max(1, Number(e.target.value)))
                        }
                        style={{
                          width: "55px",
                          padding: "2px 4px",
                          fontSize: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.05"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(item.id, "price", Number(e.target.value))
                        }
                        style={{
                          width: "80px",
                          padding: "2px 4px",
                          fontSize: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                        }}
                      />
                    </td>
                    <td>
                      <button className="btn-remove" onClick={() => handleRemoveItem(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="basket-modal-footer">
          <div className="margin-summary">
            <span>Required margin: </span>
            <strong>
              ₹
              {totalMarginRequired.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
          <div className="footer-actions">
            {items.length > 0 && (
              <button className="btn-secondary" onClick={handleClear} disabled={isExecuting || isSaving}>
                Clear basket
              </button>
            )}
            <button
              className="btn-secondary"
              style={{ border: "1px solid #387ed1", color: "#387ed1", background: "#f0f7ff" }}
              disabled={isSaving || isExecuting}
              onClick={() => handleSaveBasket(true)}
            >
              {isSaving ? "Saving..." : "Save Basket"}
            </button>
            <button
              className="btn-primary"
              disabled={items.length === 0 || isExecuting || isSaving}
              onClick={handleExecuteBasket}
            >
              {isExecuting ? "Executing Basket..." : `Place all ${items.length} orders`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketModal;
