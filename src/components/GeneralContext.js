import React, { useState, useEffect, createContext, useCallback } from "react";
import { API_BASE, AUTH_PORTAL_URL, readCookie, getCsrfToken, setCsrfToken } from "../config/api";
import axios from "axios";
import BuyActionWindow from "./BuyActionWindow";
import BasketModal from "./overlays/BasketModal";
import NomineeModal from "./overlays/NomineeModal";
import GttModal from "./overlays/GttModal";
import MarketDepthModal from "./overlays/MarketDepthModal";
import MarketMoversModal from "./overlays/MarketMoversModal";
import SegmentSettingsModal from "./overlays/SegmentSettingsModal";
import ClientProfileModal from "./overlays/ClientProfileModal";
import ConsoleModal from "./overlays/ConsoleModal";
import CoinModal from "./overlays/CoinModal";
import KeyboardShortcutsModal from "./overlays/KeyboardShortcutsModal";
import InviteFriendsModal from "./overlays/InviteFriendsModal";
import SupportModal from "./overlays/SupportModal";

import KiteToast from "./common/KiteToast";
import { currentUser as defaultUser } from "../data/mockData";

const GeneralContext = createContext({
  openBuyWindow: (uid, mode, defaultPrice) => {},
  closeBuyWindow: () => {},
  isBasketModalOpen: false,
  openBasketModal: () => {},
  closeBasketModal: () => {},
  isNomineeModalOpen: false,
  openNomineeModal: () => {},
  closeNomineeModal: () => {},
  isSegmentModalOpen: false,
  openSegmentModal: () => {},
  closeSegmentModal: () => {},
  userSegments: {},
  fetchUserSegments: () => {},
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
  openClientProfile: () => {},
  closeClientProfile: () => {},
  openConsole: () => {},
  closeConsole: () => {},
  openCoin: () => {},
  closeCoin: () => {},
  openShortcuts: () => {},
  closeShortcuts: () => {},
  openInvite: () => {},
  closeInvite: () => {},
  openSupport: (tab) => {},
  closeSupport: () => {},
  closeAllOverlays: () => {},
  currentUser: null,
  isAuthenticated: false,
  isAuthChecking: true,
  updateUser: (patch) => {},
  activeWatchlistGroup: 1,
  setActiveWatchlistGroup: (id) => {},
  baskets: [],
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

function getLaunchParams() {
  const hash = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
  if (hash && hash.includes("token=")) {
    return new URLSearchParams(hash);
  }
  return new URLSearchParams(window.location.search);
}

export const GeneralContextProvider = (props) => {
  // Initial authentication determination
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(localStorage.getItem("zerodha_user"));
    } catch (e) {
      return false;
    }
  });

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("zerodha_user");
      return storedUser ? JSON.parse(storedUser) : null;
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
  const [isClientProfileOpen, setIsClientProfileOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isCoinOpen, setIsCoinOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportInitialTab, setSupportInitialTab] = useState("SUPPORT");
  const [isBasketsDropdownOpen, setIsBasketsDropdownOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [userSegments, setUserSegments] = useState({});
  const [activeWatchlistGroup, setActiveWatchlistGroup] = useState(1);
  const [baskets, setBaskets] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [portfolioTrigger, setPortfolioTrigger] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (typeFilter = "ALL") => {
    try {
      const activeUserId = currentUser?.userId;
      const params = { userId: activeUserId, limit: 50 };
      if (typeFilter && typeFilter !== "ALL") {
        params.type = typeFilter;
      }
      const res = await axios.get(`${API_BASE}/notifications`, { params });
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.warn("Error fetching notifications:", e.message);
    }
  }, [currentUser]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const activeUserId = currentUser?.userId;
      const res = await axios.get(`${API_BASE}/notifications/unreadCount`, {
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
      await axios.patch(`${API_BASE}/notifications/${id}/read`);
    } catch (e) {
      console.error("Error marking notification as read:", e.message);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    try {
      const activeUserId = currentUser?.userId;
      await axios.post(`${API_BASE}/notifications/markAllRead`, {
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
      await axios.delete(`${API_BASE}/notifications/${id}`);
    } catch (e) {
      console.error("Error deleting notification:", e.message);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      const activeUserId = currentUser?.userId;
      await axios.post(`${API_BASE}/notifications/clearAll`, {
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

  const fetchUserBaskets = useCallback(async () => {
    try {
      const activeUserId = currentUser?.userId;
      const res = await axios.get(`${API_BASE}/allBaskets`, {
        params: { userId: activeUserId },
      });
      if (Array.isArray(res.data)) {
        setBaskets(res.data);
      }
    } catch (e) {
      console.warn("Error fetching baskets in context:", e.message);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserBaskets();
  }, [fetchUserBaskets, portfolioTrigger]);

  const fetchUserSegments = useCallback(async () => {
    try {
      const activeUserId = currentUser?.userId;
      if (!activeUserId) return;
      const res = await axios.get(`${API_BASE}/userSegments`, {
        params: { userId: activeUserId },
      });
      if (res.data?.success && res.data.segments) {
        setUserSegments(res.data.segments);
      }
    } catch (e) {
      console.warn("Error fetching user segments in context:", e.message);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserSegments();
  }, [fetchUserSegments, portfolioTrigger]);

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

  // Sync authoritative session from HttpOnly cookie via /verifyUser on mount
  useEffect(() => {
    try {
      localStorage.removeItem("zerodha_token");
      if (window.location.hash && window.location.hash.includes("token=")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      fetch(`${API_BASE}/verifyUser`, { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) {
            localStorage.removeItem("zerodha_user");
            setCurrentUser(null);
            setIsAuthenticated(false);
            return;
          }
          const data = await res.json();
          if (data?.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
          if (data?.user) {
            const fullProfile = {
              ...defaultUser,
              ...data.user,
              name: data.user.fullName || data.user.userId || "Trader",
            };
            localStorage.setItem(
              "zerodha_user",
              JSON.stringify({
                userId: fullProfile.userId,
                fullName: fullProfile.fullName,
                name: fullProfile.name,
                avatarText: fullProfile.avatarText,
                role: fullProfile.role,
              })
            );
            setCurrentUser(fullProfile);
            setIsAuthenticated(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsAuthChecking(false);
        });
    } catch (e) {
      console.warn("Could not sync user credentials:", e);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsAuthChecking(false);
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
    setIsBasketsDropdownOpen(false);
    setIsClientProfileOpen(false);
    setIsConsoleOpen(false);
    setIsCoinOpen(false);
    setIsShortcutsOpen(false);
    setIsInviteOpen(false);
    setIsSupportOpen(false);
  };

  const openClientProfile = useCallback(() => {
    closeAllOverlays();
    setIsClientProfileOpen(true);
  }, []);
  const closeClientProfile = useCallback(() => setIsClientProfileOpen(false), []);

  const openConsole = useCallback(() => {
    closeAllOverlays();
    setIsConsoleOpen(true);
  }, []);
  const closeConsole = useCallback(() => setIsConsoleOpen(false), []);

  const openCoin = useCallback(() => {
    closeAllOverlays();
    setIsCoinOpen(true);
  }, []);
  const closeCoin = useCallback(() => setIsCoinOpen(false), []);

  const openShortcuts = useCallback(() => {
    closeAllOverlays();
    setIsShortcutsOpen(true);
  }, []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);

  const openInvite = useCallback(() => {
    closeAllOverlays();
    setIsInviteOpen(true);
  }, []);
  const closeInvite = useCallback(() => setIsInviteOpen(false), []);

  const openSupport = useCallback((tab = "SUPPORT") => {
    closeAllOverlays();
    setSupportInitialTab(tab);
    setIsSupportOpen(true);
  }, []);
  const closeSupport = useCallback(() => setIsSupportOpen(false), []);

  const openSegmentModal = useCallback(() => {
    closeAllOverlays();
    setIsSegmentModalOpen(true);
  }, []);

  const closeSegmentModal = useCallback(() => {
    setIsSegmentModalOpen(false);
  }, []);

  const toggleBasketsDropdown = () => {
    setIsBasketsDropdownOpen((prev) => !prev);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  const closeBasketsDropdown = () => {
    setIsBasketsDropdownOpen(false);
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
    setCurrentUser((prev) => {
      const base = prev || defaultUser;
      const updated = { ...base, ...patch };
      try {
        localStorage.setItem("zerodha_user", JSON.stringify(updated));
        if (patch.theme) {
          localStorage.setItem("zerodha_theme", patch.theme);
          document.documentElement.setAttribute("data-theme", patch.theme);
          document.body.setAttribute("data-theme", patch.theme);
        }
        if (typeof patch.isPrivacyMode !== "undefined") {
          localStorage.setItem("zerodha_privacy", patch.isPrivacyMode ? "true" : "false");
          document.documentElement.setAttribute("data-privacy", patch.isPrivacyMode ? "true" : "false");
          document.body.setAttribute("data-privacy", patch.isPrivacyMode ? "true" : "false");
        }
      } catch (e) {}
      return updated;
    });
  };

  // Synchronize Theme
  useEffect(() => {
    const savedTheme = currentUser?.theme || localStorage.getItem("zerodha_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.body.setAttribute("data-theme", savedTheme);
  }, [currentUser?.theme]);

  // Synchronize Privacy Mode
  useEffect(() => {
    const isPrivacy = Boolean(
      typeof currentUser?.isPrivacyMode !== "undefined"
        ? currentUser.isPrivacyMode
        : localStorage.getItem("zerodha_privacy") === "true"
    );
    document.documentElement.setAttribute("data-privacy", isPrivacy ? "true" : "false");
    document.body.setAttribute("data-privacy", isPrivacy ? "true" : "false");
  }, [currentUser?.isPrivacyMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setCurrentUser((prev) => {
          const nextPrivacy = !prev?.isPrivacyMode;
          const updated = prev ? { ...prev, isPrivacyMode: nextPrivacy } : { isPrivacyMode: nextPrivacy };
          try {
            localStorage.setItem("zerodha_user", JSON.stringify(updated));
            localStorage.setItem("zerodha_privacy", nextPrivacy ? "true" : "false");
          } catch (err) {}
          return updated;
        });
        return;
      }

      if (e.key === "Escape") {
        closeAllOverlays();
        return;
      }

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.key === "b" || e.key === "B") {
        handleOpenBuyWindow("INFY", "BUY", 1845.50);
      } else if (e.key === "s" || e.key === "S") {
        handleOpenBuyWindow("INFY", "SELL", 1845.50);
      } else if (e.key === "d" || e.key === "D") {
        openDepthModal("INFY");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser?.isPrivacyMode]);

  const handleLogout = async () => {
    try {
      const csrf = getCsrfToken();
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      });
      localStorage.removeItem("zerodha_token");
      localStorage.removeItem("zerodha_user");
      localStorage.removeItem("zerodha_csrf");
      try {
        sessionStorage.removeItem("zerodha_csrf");
      } catch (e) {}
    } catch (e) {
      console.error("Error clearing session:", e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    closeAllOverlays();
    window.location.href = `${AUTH_PORTAL_URL}/login`;
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
        isSegmentModalOpen,
        openSegmentModal,
        closeSegmentModal,
        userSegments,
        fetchUserSegments,
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
        isBasketsDropdownOpen,
        toggleBasketsDropdown,
        closeBasketsDropdown,
        fetchUserBaskets,
        isProfileOpen,
        toggleProfile,
        closeProfile,
        openClientProfile,
        closeClientProfile,
        openConsole,
        closeConsole,
        openCoin,
        closeCoin,
        openShortcuts,
        closeShortcuts,
        openInvite,
        closeInvite,
        openSupport,
        closeSupport,
        closeAllOverlays,
        currentUser: currentUser || defaultUser,
        isAuthenticated,
        isAuthChecking,
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
      {isSegmentModalOpen && <SegmentSettingsModal isOpen={isSegmentModalOpen} onClose={closeSegmentModal} />}
      {isGttModalOpen && <GttModal isOpen={isGttModalOpen} onClose={closeGttModal} initialSymbol={gttData.symbol} initialPrice={gttData.price} />}
      {isDepthModalOpen && <MarketDepthModal isOpen={isDepthModalOpen} onClose={closeDepthModal} symbol={depthSymbol} />}
      {isBuyWindowOpen && (
        <BuyActionWindow
          uid={orderWindowData.uid}
          initialMode={orderWindowData.mode}
          initialPrice={orderWindowData.defaultPrice}
        />
      )}
      {isClientProfileOpen && (
        <ClientProfileModal
          isOpen={isClientProfileOpen}
          onClose={closeClientProfile}
          currentUser={currentUser || defaultUser}
          onOpenNominee={openNomineeModal}
          onOpenSegment={openSegmentModal}
        />
      )}
      {isConsoleOpen && (
        <ConsoleModal
          isOpen={isConsoleOpen}
          onClose={closeConsole}
          showToast={showToast}
        />
      )}
      {isCoinOpen && (
        <CoinModal
          isOpen={isCoinOpen}
          onClose={closeCoin}
          showToast={showToast}
        />
      )}
      {isShortcutsOpen && (
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={closeShortcuts}
        />
      )}
      {isInviteOpen && (
        <InviteFriendsModal
          isOpen={isInviteOpen}
          onClose={closeInvite}
          currentUser={currentUser || defaultUser}
          showToast={showToast}
        />
      )}
      {isSupportOpen && (
        <SupportModal
          isOpen={isSupportOpen}
          onClose={closeSupport}
          initialTab={supportInitialTab}
          showToast={showToast}
          currentUser={currentUser || defaultUser}
          fetchNotifications={fetchNotifications}
        />
      )}
      <KiteToast toasts={toasts} onDismiss={dismissToast} />
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
