import React, { useState, useEffect, createContext } from "react";
import BuyActionWindow from "./BuyActionWindow";
import BasketModal from "./overlays/BasketModal";
import { currentUser as defaultUser, initialBaskets } from "../data/mockData";

const GeneralContext = createContext({
  openBuyWindow: (uid) => {},
  closeBuyWindow: () => {},
  isBasketModalOpen: false,
  openBasketModal: () => {},
  closeBasketModal: () => {},
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
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeWatchlistGroup, setActiveWatchlistGroup] = useState(1);
  const [baskets, setBaskets] = useState(initialBaskets);

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

  const handleOpenBuyWindow = (uid) => {
    setIsBuyWindowOpen(true);
    setSelectedStockUID(uid);
    closeAllOverlays();
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setSelectedStockUID("");
  };

  const closeAllOverlays = () => {
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  const openBasketModal = () => {
    setIsBasketModalOpen(true);
    closeAllOverlays();
  };

  const closeBasketModal = () => {
    setIsBasketModalOpen(false);
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
    window.location.href = "http://localhost:3000/signup";
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        isBasketModalOpen,
        openBasketModal,
        closeBasketModal,
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
      }}
    >
      {props.children}
      {isBuyWindowOpen && <BuyActionWindow uid={selectedStockUID} />}
      {isBasketModalOpen && <BasketModal onClose={closeBasketModal} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
