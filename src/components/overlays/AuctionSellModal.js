import React, { useState } from "react";
import axios from "axios";
import "./AuctionSellModal.css";

const API_BASE = "http://localhost:3002";

const AuctionSellModal = ({
  auction,
  onClose,
  onOfferSuccess,
  currentUser,
  holdings = [],
  showToast,
  refreshPortfolio,
}) => {
  // Check user Demat holding
  const userHolding = (holdings || []).find(
    (h) => (h.instrument || h.name || "").toUpperCase() === (auction?.symbol || "").toUpperCase()
  );
  const ownedQty = userHolding ? Number(userHolding.qty || 0) : 0;

  const basePrice = auction?.basePrice || 100;
  const maxPrice = auction?.maxAllowedPrice || basePrice * 1.2;

  // Default offer price set at +10% premium
  const [offerPrice, setOfferPrice] = useState(
    auction ? Math.round(basePrice * 1.1 * 100) / 100 : 100
  );
  const [offerQty, setOfferQty] = useState(ownedQty > 0 ? Math.min(ownedQty, 10) : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!auction) return null;

  const totalProceeds = offerQty * offerPrice;
  const premiumVal = ((offerPrice - basePrice) / basePrice) * 100;
  const alphaGain = Math.max(0, (offerPrice - basePrice) * offerQty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (ownedQty === 0) {
      setErrorMsg(`You do not hold any free shares of ${auction.symbol} in your Demat account.`);
      return;
    }

    if (offerQty > ownedQty) {
      setErrorMsg(`Cannot offer more than your Demat balance of ${ownedQty} shares.`);
      return;
    }

    if (offerPrice > maxPrice) {
      setErrorMsg(`Offer price cannot exceed the exchange ceiling of ₹${maxPrice.toFixed(2)} (+20% cap).`);
      return;
    }

    if (offerPrice < basePrice * 0.9) {
      setErrorMsg(`Offer price cannot be lower than ₹${(basePrice * 0.9).toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/submitAuctionOffer`, {
        userId: currentUser?.userId,
        symbol: auction.symbol,
        companyName: auction.name,
        quantity: offerQty,
        offerPrice,
      });

      if (res.data?.success) {
        if (showToast) {
          showToast(
            "Auction Offer Placed",
            `Successfully submitted offer for ${offerQty} shares of ${auction.name} @ ₹${offerPrice.toFixed(2)} (+${premiumVal.toFixed(1)}% premium)!`,
            "success"
          );
        }
        if (refreshPortfolio) refreshPortfolio();
        if (onOfferSuccess) onOfferSuccess(res.data.offer);
        onClose();
      } else {
        setErrorMsg(res.data?.message || "Failed to submit auction offer.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit auction offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auction-modal-backdrop" onClick={onClose}>
      <div className="auction-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="auction-modal-header">
          <div>
            <div className="auction-badge-row">
              <span className="auction-tag-pill">Exchange Shortage Auction</span>
              <span className="auction-time-pill">⏰ Window: 14:00 - 14:45 IST</span>
            </div>
            <h3 className="auction-title">
              Sell {auction.symbol} <span className="auction-subname">({auction.name})</span>
            </h3>
          </div>
          <button className="auction-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {errorMsg && <div className="auction-error-banner">{errorMsg}</div>}

        {/* Demat Holding Status Banner */}
        <div className={`auction-holding-banner ${ownedQty > 0 ? "has-holding" : "no-holding"}`}>
          <div>
            <span className="holding-label">Your Demat Free Balance:</span>
            <strong className="holding-val">{ownedQty} shares</strong>
          </div>
          {ownedQty > 0 ? (
            <span className="holding-eligible-badge">✓ Eligible to Sell in Auction</span>
          ) : (
            <span className="holding-ineligible-badge">✕ No Demat Shares Available</span>
          )}
        </div>

        {/* Auction Parameters Grid */}
        <div className="auction-kpi-grid">
          <div className="auction-kpi-card">
            <span className="kpi-label">Base Settlement Price</span>
            <strong className="kpi-val">₹{basePrice.toFixed(2)}</strong>
          </div>
          <div className="auction-kpi-card highlight-cap">
            <span className="kpi-label">Max Allowed Cap (+20%)</span>
            <strong className="kpi-val text-green">₹{maxPrice.toFixed(2)}</strong>
          </div>
          <div className="auction-kpi-card">
            <span className="kpi-label">Market Shortage Demand</span>
            <strong className="kpi-val">{auction.shortQtyRequired} shares</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auction-form">
          {/* Quantity Selector */}
          <div className="form-group-auction">
            <div className="label-row-auction">
              <label>Offer Quantity (Shares)</label>
              {ownedQty > 0 && (
                <button
                  type="button"
                  className="btn-link-max"
                  onClick={() => setOfferQty(ownedQty)}
                >
                  Set Max ({ownedQty})
                </button>
              )}
            </div>
            <div className="qty-input-wrap">
              <button
                type="button"
                className="btn-counter"
                onClick={() => setOfferQty(Math.max(1, offerQty - 1))}
                disabled={offerQty <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={Math.max(1, ownedQty)}
                value={offerQty}
                onChange={(e) =>
                  setOfferQty(Math.max(1, Math.min(ownedQty || 9999, parseInt(e.target.value) || 1)))
                }
                className="input-qty-number"
              />
              <button
                type="button"
                className="btn-counter"
                onClick={() => setOfferQty(Math.min(ownedQty || 9999, offerQty + 1))}
                disabled={ownedQty > 0 && offerQty >= ownedQty}
              >
                +
              </button>
            </div>
          </div>

          {/* Offer Price with Premium */}
          <div className="form-group-auction">
            <div className="label-row-auction">
              <label>Your Auction Offer Price (₹)</label>
              <span className={`premium-indicator ${premiumVal >= 0 ? "text-green" : "text-red"}`}>
                {premiumVal >= 0 ? `+${premiumVal.toFixed(2)}%` : `${premiumVal.toFixed(2)}%`} Premium
              </span>
            </div>
            <div className="price-input-wrap">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                step="0.05"
                min={(basePrice * 0.9).toFixed(2)}
                max={maxPrice.toFixed(2)}
                value={offerPrice}
                onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                className="input-price-field"
              />
            </div>
            <span className="help-text">
              Upper exchange cap is ₹{maxPrice.toFixed(2)}. Highest offers under the cap are prioritized.
            </span>
          </div>

          {/* Settlement Calculation Summary */}
          <div className="proceeds-summary-box">
            <div className="summary-row">
              <span>Gross Settlement Credit:</span>
              <strong>₹{totalProceeds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
            {alphaGain > 0 && (
              <div className="summary-row text-green">
                <span>Extra Auction Alpha (Over Base):</span>
                <strong>+₹{alphaGain.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <div className="summary-row small-text">
              <span>Settlement Guarantee:</span>
              <span>100% Exchange NCL Settlement on T+1</span>
            </div>
          </div>

          <div className="auction-modal-actions">
            <button type="button" className="btn-auction-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-auction-submit"
              disabled={isSubmitting || ownedQty === 0 || offerQty > ownedQty}
            >
              {isSubmitting ? "Placing Offer..." : `Place Auction Sell Offer (${offerQty} shares)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionSellModal;
