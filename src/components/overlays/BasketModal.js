import React, { useState, useEffect } from "react";
import "./BasketModal.css";

const BasketModal = ({ onClose }) => {
  const [basketName, setBasketName] = useState("Intraday Options");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([
    { id: 1, symbol: "NIFTY 24500 CE", type: "BUY", qty: 50, price: 124.50 },
    { id: 2, symbol: "BANKNIFTY 52000 PE", type: "BUY", qty: 30, price: 215.20 },
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleClear = () => {
    setItems([]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="basket-modal-overlay" onClick={onClose}>
      <div className="basket-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="basket-modal-header">
          <div className="basket-title-group">
            <svg className="basket-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <input
              type="text"
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
              className="basket-name-input"
            />
            <span className="basket-item-count">({items.length} items)</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="basket-search-bar">
          <input
            type="text"
            placeholder="Search & add instruments (e.g. infy, nifty fut)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="basket-search-input"
          />
        </div>

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
                      <span className={`badge ${item.type.toLowerCase()}`}>{item.type}</span>
                    </td>
                    <td>{item.qty}</td>
                    <td>₹{item.price.toFixed(2)}</td>
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

        <div className="basket-modal-footer">
          <div className="margin-summary">
            <span>Required margin: </span>
            <strong>{items.length > 0 ? "₹32,680.00" : "₹0.00"}</strong>
          </div>
          <div className="footer-actions">
            {items.length > 0 && (
              <button className="btn-secondary" onClick={handleClear}>
                Clear basket
              </button>
            )}
            <button
              className="btn-primary"
              disabled={items.length === 0}
              onClick={() => {
                alert(`Order placed for ${items.length} instruments in basket!`);
                onClose();
              }}
            >
              Place all orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketModal;
