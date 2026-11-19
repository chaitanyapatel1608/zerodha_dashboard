import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        padding: "40px 20px",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          padding: "48px 36px",
        }}
      >
        {/* Subtle Kite Illustrated 404 Icon */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "#f0f4f9",
            marginBottom: "20px",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#387ed1"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>

        {/* 404 Badge */}
        <div
          style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            padding: "4px 10px",
            borderRadius: "12px",
            marginBottom: "12px",
          }}
        >
          404 &bull; Route Not Found
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "600",
            color: "#1e293b",
            margin: "0 0 10px 0",
          }}
        >
          This page does not exist
        </h1>

        {/* Dynamic path indicator */}
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            lineHeight: "1.6",
            margin: "0 0 24px 0",
          }}
        >
          We couldn't find any trading terminal section at{" "}
          <code
            style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "2px 8px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "13px",
              fontWeight: "600",
              wordBreak: "break-all",
            }}
          >
            {location.pathname}
          </code>
          . It may have been moved or the URL might be mistyped.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              backgroundColor: "#387ed1",
              color: "#ffffff",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 2px 6px rgba(56, 126, 209, 0.25)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>

        {/* Quick Links Section */}
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Quick Navigation
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {[
              { label: "Orders", path: "/orders" },
              { label: "Holdings", path: "/holdings" },
              { label: "Positions", path: "/positions" },
              { label: "Funds", path: "/funds" },
              { label: "Bids & IPOs", path: "/bids" },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  fontSize: "13px",
                  color: "#387ed1",
                  backgroundColor: "#f8fafc",
                  padding: "5px 12px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  fontWeight: "500",
                  border: "1px solid #e2e8f0",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
