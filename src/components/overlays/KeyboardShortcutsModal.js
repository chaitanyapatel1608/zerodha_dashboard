import React from "react";
import "./KeyboardShortcutsModal.css";

const SHORTCUT_GROUPS = [
  {
    title: "Order Placement & Actions",
    shortcuts: [
      { key: "B", desc: "Open Buy Order window for selected stock" },
      { key: "S", desc: "Open Sell Order window for selected stock" },
      { key: "D", desc: "Toggle 5-Level Market Depth & Best 5 Bids" },
      { key: "C", desc: "Cancel selected pending order" },
      { key: "M", desc: "Modify pending order quantity / limit price" },
    ],
  },
  {
    title: "Terminal Navigation",
    shortcuts: [
      { key: "F", desc: "Navigate to Funds & Margins Desk" },
      { key: "H", desc: "Navigate to Holdings Demat Portfolio" },
      { key: "O", desc: "Navigate to Orders Book & SIP desk" },
      { key: "P", desc: "Navigate to Intraday & F&O Positions" },
    ],
  },
  {
    title: "General & Utility",
    shortcuts: [
      { key: "Ctrl + /", desc: "Toggle this Keyboard Shortcuts Cheat Sheet" },
      { key: "Shift + P", desc: "Toggle Privacy Mode (Mask Balances & P&L)" },
      { key: "Esc", desc: "Close any open modal or overlay window" },
      { key: "↑ / ↓", desc: "Navigate active stock watchlist" },
    ],
  },
];

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="shortcuts-modal-backdrop" onClick={onClose}>
      <div className="shortcuts-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div>
            <span className="shortcuts-badge">PRO PRODUCTIVITY</span>
            <h3 className="shortcuts-title">Keyboard Shortcuts</h3>
            <span className="shortcuts-subtitle">Trade faster with Kite pro keybindings</span>
          </div>
          <button className="shortcuts-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="shortcuts-modal-body">
          <div className="shortcuts-grid">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="shortcuts-group-card">
                <div className="group-title">{group.title}</div>
                <div className="group-items">
                  {group.shortcuts.map((s) => (
                    <div key={s.key} className="shortcut-row">
                      <span className="shortcut-desc">{s.desc}</span>
                      <kbd className="shortcut-key">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shortcuts-modal-footer">
          <span className="shortcuts-footer-note">💡 Tip: Press Esc anytime to close dialogs</span>
          <button type="button" className="btn-shortcuts-close" onClick={onClose}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;