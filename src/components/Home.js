import React, { useContext, useEffect } from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import GeneralContext, { GeneralContextProvider } from "./GeneralContext";

const HomeContent = () => {
  const { isAuthenticated } = useContext(GeneralContext);

  useEffect(() => {
    // If not authenticated, redirect to login portal
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        window.location.href = "http://localhost:3000/login";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

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
            href="http://localhost:3000/login"
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
    </div>
  );
};

const Home = () => {
  return (
    <GeneralContextProvider>
      <HomeContent />
    </GeneralContextProvider>
  );
};

export default Home;
