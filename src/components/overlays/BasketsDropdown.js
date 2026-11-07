import React, { useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import GeneralContext from "../GeneralContext";
import "./BasketsDropdown.css";

const BasketsDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    baskets = [],
    openBasketModal = () => {},
    fetchUserBaskets = () => {},
  } = useContext(GeneralContext);

  // Refresh baskets when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchUserBaskets();
    }
  }, [isOpen, fetchUserBaskets]);

  // Handle clicking outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const basketBtn = document.querySelector(".nav-icon-btn.basket-btn");
        if (!basketBtn || !basketBtn.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalLegs = baskets.reduce((sum, b) => sum + (b.items ? b.items.length : 0), 0);
  const totalMargin = baskets.reduce((sum, b) => sum + Number(b.marginRequired || 0), 0);

  const handleOpenAllBaskets = () => {
    onClose();
    navigate("/orders", { state: { defaultSubTab: "baskets" } });
  };

  const handleBasketItemClick = (basket) => {
    onClose();
    navigate("/orders", { state: { defaultSubTab: "baskets" } });
  };

  const handleQuickExecute = (e, basket) => {
    e.stopPropagation();
    onClose();
    navigate("/orders", {
      state: { defaultSubTab: "baskets", executeBasketId: basket._id },
    });
  };

  const handleCreateNew = (e) => {
    e.stopPropagation();
    onClose();
    openBasketModal(null);
  };

  return (
    <div className="baskets-dropdown" ref={dropdownRef}>
      {/* Header */}
      <div className="baskets-dropdown-header">
        <div className="dropdown-title-row">
          <span className="dropdown-basket-icon">🛍️</span>
          <h4 className="dropdown-title">My Order Baskets</h4>
          <span className="dropdown-count-badge">{baskets.length}</span>
        </div>
        <button
          type="button"
          className="btn-dropdown-new-basket"
          onClick={handleCreateNew}
          title="Create New Basket"
        >
          + New Basket
        </button>
      </div>

      {/* Summary Row */}
      {baskets.length > 0 && (
        <div className="baskets-dropdown-summary">
          <span>{totalLegs} total order legs</span>
          <span className="summary-dot">•</span>
          <span>Est. Margin: ₹{totalMargin.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )}

      {/* Basket Items List */}
      <div className="baskets-dropdown-list">
        {baskets.length === 0 ? (
          <div className="baskets-dropdown-empty">
            <span className="empty-icon">📁</span>
            <h5>No Baskets Created</h5>
            <p>Group multi-leg orders to execute together with 1 click.</p>
            <div className="empty-actions">
              <button
                type="button"
                className="btn-empty-action primary"
                onClick={handleCreateNew}
              >
                + Create First Basket
              </button>
              <button
                type="button"
                className="btn-empty-action"
                onClick={handleOpenAllBaskets}
              >
                ⭐ Browse Strategy Templates
              </button>
            </div>
          </div>
        ) : (
          baskets.map((b) => {
            const items = Array.isArray(b.items) ? b.items : [];
            const margin = Number(b.marginRequired || 0);

            return (
              <div
                className="baskets-dropdown-item"
                key={b._id || b.id}
                onClick={() => handleBasketItemClick(b)}
              >
                <div className="item-top-row">
                  <span className="item-name">{b.name}</span>
                  <span className="item-legs-tag">{items.length} orders</span>
                </div>

                {/* Constituent Chips */}
                {items.length > 0 && (
                  <div className="item-chips-row">
                    {items.slice(0, 3).map((it, idx) => (
                      <span
                        key={idx}
                        className={`item-chip ${(it.mode || "BUY").toLowerCase()}`}
                      >
                        {it.mode || "BUY"} {it.qty}× {it.symbol || it.name}
                      </span>
                    ))}
                    {items.length > 3 && (
                      <span className="item-chip-more">+{items.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="item-bottom-row">
                  <span className="item-margin">
                    Margin: <strong>₹{margin.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn-item-quick-execute"
                    onClick={(e) => handleQuickExecute(e, b)}
                    title="Execute Basket"
                  >
                    ⚡ Execute
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="baskets-dropdown-footer">
        <button
          type="button"
          className="btn-footer-view-all"
          onClick={handleOpenAllBaskets}
        >
          View All Baskets & Strategy Templates in Orders &rarr;
        </button>
      </div>
    </div>
  );
};

export default BasketsDropdown;
