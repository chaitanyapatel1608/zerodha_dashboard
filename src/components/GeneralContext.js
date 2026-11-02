import React, { useState, createContext } from "react";
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
  currentUser: defaultUser,
  updateUser: (patch) => {},
  activeWatchlistGroup: 1,
  setActiveWatchlistGroup: (id) => {},
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeWatchlistGroup, setActiveWatchlistGroup] = useState(1);
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [baskets, setBaskets] = useState(initialBaskets);

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
    setCurrentUser((prev) => ({ ...prev, ...patch }));
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
        currentUser,
        updateUser,
        activeWatchlistGroup,
        setActiveWatchlistGroup,
        baskets,
        setBaskets,
      }}
    >
      {props.children}
      {isBuyWindowOpen && <BuyActionWindow uid={selectedStockUID} />}
      {isBasketModalOpen && <BasketModal onClose={closeBasketModal} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
