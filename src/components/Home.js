import React, { useContext, useEffect } from "react";
import { API_BASE, AUTH_PORTAL_URL } from "../config/api";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import MobileBottomNav from "./navigation/MobileBottomNav";
import GeneralContext, { GeneralContextProvider } from "./GeneralContext";
import { MarketFeedProvider } from "../context/MarketFeedContext";

const HomeContent = () => {
  const { isAuthenticated, isAuthChecking } = useContext(GeneralContext);

  const currentPath = typeof window !== "undefined" && window.location.pathname !== "/"
    ? window.location.pathname + window.location.search
    : "";
  const redirectUri = currentPath
    ? encodeURIComponent(`${window.location.origin}${currentPath}`)
    : "";
  const loginUrl = redirectUri
    ? `${AUTH_PORTAL_URL}/login?redirect_uri=${redirectUri}`
    : `${AUTH_PORTAL_URL}/login`;

  useEffect(() => {
    // Only redirect to login portal if session verification has concluded and user is unauthenticated
    if (!isAuthChecking && !isAuthenticated) {
      const timer = setTimeout(() => {
        window.location.href = loginUrl;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isAuthChecking, isAuthenticated, loginUrl]);

  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f9fa",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo.png"
            alt="Zerodha Kite Logo"
            style={{ width: "52px", height: "auto", marginBottom: "16px" }}
          />
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#444", marginBottom: "8px" }}>
            Launching Kite Trading Terminal...
          </h3>
          <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
            Verifying secure session with broker
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f9fa",
          padding: "20px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "44px 36px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            textAlign: "center",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <img
            src="/logo.png"
            alt="Zerodha Kite Logo"
            style={{ width: "52px", height: "auto", marginBottom: "20px" }}
          />
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>
            Session Expired
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px", lineHeight: "1.6" }}>
            You are logged out. Please log in with your Zerodha Kite account to access the trading terminal.
          </p>
          <a
            href={loginUrl}
            style={{
              display: "block",
              width: "100%",
              padding: "11px 0",
              backgroundColor: "#387ed1",
              color: "#ffffff",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "15px",
              boxShadow: "0 2px 6px rgba(56,126,209,0.3)",
            }}
          >
            Login to Kite
          </a>
          <span style={{ display: "block", marginTop: "16px", fontSize: "12px", color: "#999" }}>
            Redirecting to login portal in 2 seconds...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <Dashboard />
      <MobileBottomNav />
    </div>
  );
};

const Home = () => {
  return (
    <GeneralContextProvider>
      <MarketFeedProvider>
        <HomeContent />
      </MarketFeedProvider>
    </GeneralContextProvider>
  );
};

export default Home;
