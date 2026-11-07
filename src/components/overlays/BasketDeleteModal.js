import React from "react";
import "./BasketDeleteModal.css";

const BasketDeleteModal = ({
  isOpen,
  basket,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !basket) return null;

  const itemsCount = basket.items ? basket.items.length : (basket.itemsCount || 0);

  return (
    <div className="basket-del-overlay" onClick={onClose}>
      <div className="basket-del-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="basket-del-header">
          <div className="basket-del-title-row">
            <span className="basket-del-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </span>
            <div>
              <h3 className="basket-del-title">Delete Order Basket</h3>
              <span className="basket-del-subtitle">Permanently remove basket from your Demat profile</span>
            </div>
          </div>
          <button className="basket-del-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="basket-del-body">
          <div className="basket-del-card">
            <div className="basket-del-meta-row">
              <span className="basket-del-badge">BASKET</span>
              <strong className="basket-del-name">{basket.name}</strong>
            </div>

            <div className="basket-del-stats">
              <div className="del-stat-item">
                <span className="stat-label">Constituents:</span>
                <span className="stat-val">{itemsCount} Order Legs</span>
              </div>
              <div className="del-stat-item">
                <span className="stat-label">Estimated Margin:</span>
                <span className="stat-val">
                  ₹{Number(basket.marginRequired || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <p className="basket-del-text">
            Are you sure you want to delete <strong>"{basket.name}"</strong>? All saved constituent orders and margin configurations will be removed permanently.
          </p>
        </div>

        {/* Footer */}
        <div className="basket-del-footer">
          <button type="button" className="btn-del-cancel" onClick={onClose} disabled={isDeleting}>
            Keep Basket
          </button>
          <button
            type="button"
            className="btn-del-danger"
            onClick={() => onConfirm(basket)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, Delete Basket"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasketDeleteModal;
