import React from "react";
import "./KiteToast.css";

const KiteToast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="kite-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`kite-toast-card kite-toast-${toast.type || "info"}`}
        >
          <div className="kite-toast-icon">
            {toast.type === "success" && <i className="fa-solid fa-circle-check"></i>}
            {toast.type === "error" && <i className="fa-solid fa-circle-exclamation"></i>}
            {toast.type === "info" && <i className="fa-solid fa-circle-info"></i>}
          </div>

          <div className="kite-toast-content">
            {toast.title && <div className="kite-toast-title">{toast.title}</div>}
            <div className="kite-toast-msg">{toast.message}</div>
          </div>

          <button
            className="kite-toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss toast"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default KiteToast;
