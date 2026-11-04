import React, { useState, useEffect, createContext, useCallback } from "react";
import axios from "axios";
import BuyActionWindow from "./BuyActionWindow";
import BasketModal from "./overlays/BasketModal";
import NomineeModal from "./overlays/NomineeModal";
import GttModal from "./overlays/GttModal";
import MarketDepthModal from "./overlays/MarketDepthModal";
import MarketMoversModal from "./overlays/MarketMoversModal";

import KiteToast from "./common/KiteToast";
import { currentUser as defaultUser, initialBaskets } from "../data/mockData";

const GeneralContext = createContext({
  openBuyWindow: (uid, mode, defaultPrice) => {},
  closeBuyWindow: () => {},
  isBasketModalOpen: false,
  openBasketModal: () => {},
  closeBasketModal: () => {},
  isNomineeModalOpen: false,
  openNomineeModal: () => {},
  closeNomineeModal: () => {},
  isGttModalOpen: false,
  isDepthModalOpen: false,
  openDepthModal: (sym) => {},
  closeDepthModal: () => {},
  isMarketMoversOpen: false,
  marketMoversType: "gainers",
  openMarketMovers: (type) => {},
  closeMarketMovers: () => {},
  openGttModal: (sym, price) => {},
  closeGttModal: () => {},
  isNotificationsOpen: false,
  toggleNotifications: () => {},
  closeNotifications: () => {},
  isProfileOpen: false,
  toggleProfile: () => {},
  closeProfile: () => {},
  closeAllOverlays: () => {},
  currentUser: null,
  isAuthenticated: false,
  updateUser: (patch) => {},
  activeWatchlistGroup: 1,
  setActiveWatchlistGroup: (id) => {},
  baskets: initialBaskets,
  setBaskets: () => {},
  logout: () => {},
  showToast: (title, message, type) => {},
  portfolioTrigger: 0,
  refreshPortfolio: () => {},
  notifications: [],
  unreadCount: 0,
  fetchNotifications: () => {},
  fetchUnreadCount: () => {},
  markNotificationAsRead: (id) => {},
  markAllNotificationsAsRead: () => {},
  deleteNotification: (id) => {},
  clearAllNotifications: () => {},
});

export const GeneralContextProvider = (props) => {
  // Initial authentication determination
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token") || localStorage.getItem("zerodha_token");
      return Boolean(token);
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramToken = urlParams.get("token");
      const paramUserId = urlParams.get("userId");
      const paramName = urlParams.get("name");
      const paramEmail = urlParams.get("email");

      if (paramToken && paramUserId) {
        const name = paramName ? decodeURIComponent(paramName) : "Trader";
        return {
          ...defaultUser,
          name,
          userId: paramUserId,
          email: paramEmail ? decodeURIComponent(paramEmail) : defaultUser.email,
          avatarText: name.slice(0, 2).toUpperCase() || "TR",
        };
      }

      const storedUser = localStorage.getItem("zerodha_user");
      const storedToken = localStorage.getItem("zerodha_token");
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [orderWindowData, setOrderWindowData] = useState({
    uid: "",
    mode: "BUY",
    defaultPrice: null,
  });
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [activeBasketData, setActiveBasketData] = useState(null);
  const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
  const [isGttModalOpen, setIsGttModalOpen] = useState(false);
  const [isDepthModalOpen, setIsDepthModalOpen] = useState(false);
  const [depthSymbol, setDepthSymbol] = useState("INFY");
  const [isMarketMoversOpen, setIsMarketMoversOpen] = useState(false);
  const [marketMoversType, setMarketMoversType] = useState("gainers");

  const openMarketMovers = useCallback((type = "gainers") => {
    setMarketMoversType(type);
    setIsMarketMoversOpen(true);
  }, []);

  const closeMarketMovers = useCallback(() => {
    setIsMarketMoversOpen(false);
  }, []);
  const [gttData, setGttData] = useState({ symbol: "INFY", price: null });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeWatchlistGroup, setActiveWatchlistGroup] = useState(1);
  const [baskets, setBaskets] = useState(initialBaskets);
  const [toasts, setToasts] = useState([]);
  const [portfolioTrigger, setPortfolioTrigger] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (typeFilter = "ALL") => {
    try {
      const activeUserId = currentUser?.userId || "ZU9344";
      const params = { userId: activeUserId, limit: 50 };
      if (typeFilter && typeFilter !== "ALL") {
        params.type = typeFilter;
      }
      const res = await axios.get("http://localhost:3002/notifications", { params });
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.warn("Error fetching notifications:", e.message);
    }
  }, [currentUser]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const activeUserId = currentUser?.userId || "ZU9344";
      const res = await axios.get("http://localhost:3002/notifications/unreadCount", {
        params: { userId: activeUserId },
      });
      if (res.data && typeof res.data.unreadCount === "number") {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      console.warn("Error fetching unread count:", e.message);
    }
  }, [currentUser]);

  const markNotificationAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await axios.patch(`http://localhost:3002/notifications/${id}/read`);
    } catch (e) {
      console.error("Error marking notification as read:", e.message);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    try {
      const activeUserId = currentUser?.userId || "ZU9344";
      await axios.post("http://localhost:3002/notifications/markAllRead", {
        userId: activeUserId,
      });
    } catch (e) {
      console.error("Error marking all notifications as read:", e.message);
    }
  }, [currentUser]);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n._id === id);
      if (target && target.unread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n._id !== id);
    });
    try {
      await axios.delete(`http://localhost:3002/notifications/${id}`);
    } catch (e) {
      console.error("Error deleting notification:", e.message);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      const activeUserId = currentUser?.userId || "ZU9344";
      await axios.post("http://localhost:3002/notifications/clearAll", {
        userId: activeUserId,
      });
    } catch (e) {
      console.error("Error clearing all notifications:", e.message);
    }
  }, [currentUser]);

  // Real-Time Notification Heartbeat (15s polling + immediate trigger on user actions)
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications, portfolioTrigger]);

  const refreshPortfolio = useCallback(() => {
    setPortfolioTrigger((prev) => prev + 1);
  }, []);

  const showToast = useCallback((title, message, type = "success") => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync session on mount / URL changes
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramToken = urlParams.get("token");
      const paramUserId = urlParams.get("userId");
      const paramName = urlParams.get("name");
      const paramEmail = urlParams.get("email");

      if (paramToken && paramUserId) {
        localStorage.setItem("zerodha_token", paramToken);
        const name = paramName ? decodeURIComponent(paramName) : "Trader";
        const email = paramEmail ? decodeURIComponent(paramEmail) : defaultUser.email;
        const paramPan = urlParams.get("pan");
        const paramDemat = urlParams.get("demat");
        const initials = name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "TR";

        const syncedUser = {
          ...defaultUser,
          name,
          userId: paramUserId,
          email,
          pan: paramPan ? decodeURIComponent(paramPan) : defaultUser.pan,
          demat: paramDemat ? decodeURIComponent(paramDemat) : defaultUser.demat,
          avatarText: initials,
        };
        localStorage.setItem("zerodha_user", JSON.stringify(syncedUser));
        setCurrentUser(syncedUser);
        setIsAuthenticated(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const storedToken = localStorage.getItem("zerodha_token");
      const storedUser = localStorage.getItem("zerodha_user");

      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser({ ...defaultUser, ...parsed });
      // Fetch nominee status if user ID available
      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.userId) {
            fetch(`http://localhost:3002/getNominee?userId=${parsed.userId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data && data.nomineeStatus) {
                  setCurrentUser((prev) => (prev ? { ...prev, nomineeStatus: data.nomineeStatus, nominee: data.nominee } : prev));
                }
              })
              .catch(() => {});
          }
        } catch (e) {}
      }
        setIsAuthenticated(true);
      } else {
        // Not authenticated
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn("Could not sync user credentials:", e);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const handleOpenBuyWindow = (uid, mode = "BUY", defaultPrice = null) => {
    setOrderWindowData({
      uid,
      mode: mode.toUpperCase(),
      defaultPrice,
    });
    setIsBuyWindowOpen(true);
    closeAllOverlays();
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setOrderWindowData({ uid: "", mode: "BUY", defaultPrice: null });
  };

  const closeAllOverlays = () => {
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  const openBasketModal = (basket = null) => {
    setActiveBasketData(basket);
    setIsBasketModalOpen(true);
    closeAllOverlays();
  };

  const closeBasketModal = () => {
    setActiveBasketData(null);
    setIsBasketModalOpen(false);
  };

  const openNomineeModal = () => {
    setIsNomineeModalOpen(true);
    closeAllOverlays();
  };

  const closeNomineeModal = () => {
    setIsNomineeModalOpen(false);
  };

  const openGttModal = (symbol = "INFY", price = null) => {
    setGttData({ symbol, price });
    setIsGttModalOpen(true);
    closeAllOverlays();
  };

  const closeGttModal = () => {
    setIsGttModalOpen(false);
  };

  const openDepthModal = (symbol = "INFY") => {
    setDepthSymbol(symbol);
    setIsDepthModalOpen(true);
    closeAllOverlays();
  };

  const closeDepthModal = () => {
    setIsDepthModalOpen(false);
    setIsMarketMoversOpen(false);
  };


  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsProfileOpen(false);
  };

  const closeNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
  };

  const updateUser = (patch) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...patch } : patch));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("zerodha_token");
      localStorage.removeItem("zerodha_user");
    } catch (e) {
      console.error("Error clearing session:", e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    closeAllOverlays();
    window.location.href = "http://localhost:3000/login";
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        isBasketModalOpen,
        openBasketModal,
        closeBasketModal,
        isNomineeModalOpen,
        openNomineeModal,
        closeNomineeModal,
        isGttModalOpen,
        openGttModal,
        closeGttModal,
        isDepthModalOpen,
        openDepthModal,
        closeDepthModal,
        isMarketMoversOpen,
        marketMoversType,
        openMarketMovers,
        closeMarketMovers,
        isNotificationsOpen,
        toggleNotifications,
        closeNotifications,
        isProfileOpen,
        toggleProfile,
        closeProfile,
        closeAllOverlays,
        currentUser: currentUser || defaultUser,
        isAuthenticated,
        updateUser,
        activeWatchlistGroup,
        setActiveWatchlistGroup,
        baskets,
        setBaskets,
        logout: handleLogout,
        showToast,
        portfolioTrigger,
        refreshPortfolio,
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {props.children}
      {isMarketMoversOpen && <MarketMoversModal isOpen={isMarketMoversOpen} type={marketMoversType} onClose={closeMarketMovers} />}
      {isBasketModalOpen && <BasketModal basket={activeBasketData} onClose={closeBasketModal} />}
      {isNomineeModalOpen && <NomineeModal isOpen={isNomineeModalOpen} onClose={closeNomineeModal} />}
      {isGttModalOpen && <GttModal isOpen={isGttModalOpen} onClose={closeGttModal} initialSymbol={gttData.symbol} initialPrice={gttData.price} />}
      {isDepthModalOpen && <MarketDepthModal isOpen={isDepthModalOpen} onClose={closeDepthModal} symbol={depthSymbol} />}
      {isBuyWindowOpen && (
        <BuyActionWindow
          uid={orderWindowData.uid}
          initialMode={orderWindowData.mode}
          initialPrice={orderWindowData.defaultPrice}
        />
      )}
      <KiteToast toasts={toasts} onDismiss={dismissToast} />
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
