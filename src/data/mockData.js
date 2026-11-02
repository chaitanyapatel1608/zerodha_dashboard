export const currentUser = {
  name: "Chaitanya",
  userId: "ZU8842",
  email: "chaitanya.investor@example.com",
  avatarText: "CU",
  broker: "Zerodha Broking Ltd.",
  pan: "ABCDE1234F",
  demat: "1208160012345678",
  isPrivacyMode: false,
  theme: "light",
};

export const marketIndices = [
  {
    name: "NIFTY 50",
    value: "24,340.60",
    change: "-125.40",
    percent: "-0.51%",
    isDown: true,
  },
  {
    name: "SENSEX",
    value: "79,942.20",
    change: "-420.15",
    percent: "-0.52%",
    isDown: true,
  },
];

export const watchlistGroups = [
  { id: 1, name: "Watchlist 1" },
  { id: 2, name: "Watchlist 2" },
  { id: 3, name: "Watchlist 3" },
  { id: 4, name: "Watchlist 4" },
  { id: 5, name: "Watchlist 5" },
  { id: 6, name: "Watchlist 6" },
  { id: 7, name: "Watchlist 7" },
];

export const initialWatchlist = [
  { symbol: "INFY", name: "Infosys Ltd.", exchange: "NSE", price: 1845.50, change: -18.25, percent: "-0.98%", isDown: true },
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", price: 2712.40, change: 24.30, percent: "+0.90%", isDown: false },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", exchange: "NSE", price: 1728.15, change: -6.40, percent: "-0.37%", isDown: true },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", price: 3982.75, change: 15.60, percent: "+0.39%", isDown: false },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd.", exchange: "NSE", price: 884.20, change: -12.10, percent: "-1.35%", isDown: true },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", exchange: "NSE", price: 1242.00, change: 11.80, percent: "+0.96%", isDown: false },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", price: 814.65, change: -4.50, percent: "-0.55%", isDown: true },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", exchange: "NSE", price: 1684.90, change: 22.40, percent: "+1.35%", isDown: false },
  { symbol: "ITC", name: "ITC Ltd.", exchange: "NSE", price: 478.30, change: 1.15, percent: "+0.24%", isDown: false },
  { symbol: "WIPRO", name: "Wipro Ltd.", exchange: "NSE", price: 546.80, change: -5.20, percent: "-0.94%", isDown: true },
  { symbol: "LT", name: "Larsen & Toubro Ltd.", exchange: "NSE", price: 3560.10, change: -28.75, percent: "-0.80%", isDown: true },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", exchange: "NSE", price: 2382.40, change: 8.90, percent: "+0.38%", isDown: false },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", exchange: "NSE", price: 6890.00, change: -45.50, percent: "-0.66%", isDown: true },
  { symbol: "MARUTI", name: "Maruti Suzuki India", exchange: "NSE", price: 11240.50, change: 85.00, percent: "+0.76%", isDown: false },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE", price: 1782.30, change: 14.20, percent: "+0.80%", isDown: false },
];

export const holdingsData = [
  { instrument: "BHARTIARTL", qty: 15, avgCost: 1420.50, ltp: 1684.90, curVal: 25273.50, pnl: 3966.00, netChg: "+18.61%", dayChg: "+1.35%", isProfit: true, isDayProfit: true },
  { instrument: "HDFCBANK", qty: 25, avgCost: 1610.00, ltp: 1728.15, curVal: 43203.75, pnl: 2953.75, netChg: "+7.34%", dayChg: "-0.37%", isProfit: true, isDayProfit: false },
  { instrument: "INFY", qty: 20, avgCost: 1650.00, ltp: 1845.50, curVal: 36910.00, pnl: 3910.00, netChg: "+11.85%", dayChg: "-0.98%", isProfit: true, isDayProfit: false },
  { instrument: "ITC", qty: 80, avgCost: 430.00, ltp: 478.30, curVal: 38264.00, pnl: 3864.00, netChg: "+11.23%", dayChg: "+0.24%", isProfit: true, isDayProfit: true },
  { instrument: "RELIANCE", qty: 12, avgCost: 2540.00, ltp: 2712.40, curVal: 32548.80, pnl: 2068.80, netChg: "+6.79%", dayChg: "+0.90%", isProfit: true, isDayProfit: true },
  { instrument: "SBIN", qty: 30, avgCost: 740.00, ltp: 814.65, curVal: 24439.50, pnl: 2239.50, netChg: "+10.09%", dayChg: "-0.55%", isProfit: true, isDayProfit: false },
  { instrument: "TATAMOTORS", qty: 35, avgCost: 940.00, ltp: 884.20, curVal: 30947.00, pnl: -1953.00, netChg: "-5.94%", dayChg: "-1.35%", isProfit: false, isDayProfit: false },
  { instrument: "TCS", qty: 8, avgCost: 3820.00, ltp: 3982.75, curVal: 31862.00, pnl: 1302.00, netChg: "+4.26%", dayChg: "+0.39%", isProfit: true, isDayProfit: true },
];

export const positionsData = [
  { product: "MIS", instrument: "NIFTY 24400 CE", qty: 50, avg: 112.50, ltp: 134.20, pnl: 1085.00, chg: "+19.29%", isProfit: true },
  { product: "NRML", instrument: "BANKNIFTY 51500 PE", qty: -30, avg: 245.00, ltp: 218.40, pnl: 798.00, chg: "+10.86%", isProfit: true },
  { product: "MIS", instrument: "RELIANCE", qty: 20, avg: 2698.00, ltp: 2712.40, pnl: 288.00, chg: "+0.53%", isProfit: true },
  { product: "MIS", instrument: "INFY", qty: -15, avg: 1855.00, ltp: 1845.50, pnl: 142.50, chg: "+0.51%", isProfit: true },
];

export const ipoData = [
  { symbol: "HYUNDAI", name: "Hyundai Motor India Limited", dates: "15 Oct - 17 Oct 2024", priceRange: "₹1,865 - ₹1,960", minQty: 7, minAmount: "₹13,720", status: "Closed", type: "IPO" },
  { symbol: "WAARRE", name: "Waaree Energies Limited", dates: "21 Oct - 23 Oct 2024", priceRange: "₹1,427 - ₹1,503", minQty: 9, minAmount: "₹13,527", status: "Closed", type: "IPO" },
  { symbol: "AFCONS", name: "Afcons Infrastructure Limited", dates: "25 Oct - 29 Oct 2024", priceRange: "₹440 - ₹463", minQty: 32, minAmount: "₹14,816", status: "Closed", type: "IPO" },
  { symbol: "SWIGGY", name: "Swiggy Limited", dates: "06 Nov - 08 Nov 2024", priceRange: "₹371 - ₹390", minQty: 38, minAmount: "₹14,820", status: "Apply", type: "IPO" },
  { symbol: "ACME", name: "ACME Solar Holdings Limited", dates: "06 Nov - 08 Nov 2024", priceRange: "₹275 - ₹289", minQty: 51, minAmount: "₹14,739", status: "Apply", type: "IPO" },
  { symbol: "NTPCGREEN", name: "NTPC Green Energy Limited", dates: "19 Nov - 22 Nov 2024", priceRange: "₹102 - ₹108", minQty: 138, minAmount: "₹14,904", status: "Upcoming", type: "IPO" },
];

export const topGainers = [
  { symbol: "BHARTIARTL", name: "Bharti Airtel", price: 1684.90, percent: "+1.35%", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1242.00, percent: "+0.96%", exchange: "NSE" },
  { symbol: "RELIANCE", name: "Reliance Ind.", price: 2712.40, percent: "+0.90%", exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", price: 1782.30, percent: "+0.80%", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki", price: 11240.50, percent: "+0.76%", exchange: "NSE" },
];

export const topLosers = [
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 884.20, percent: "-1.35%", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", price: 1845.50, percent: "-0.98%", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro", price: 546.80, percent: "-0.94%", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro", price: 3560.10, percent: "-0.80%", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", price: 6890.00, percent: "-0.66%", exchange: "NSE" },
];

export const accountBalances = {
  equity: {
    availableMargin: "1,42,850.45",
    usedMargin: "38,420.00",
    availableCash: "1,42,850.45",
    openingBalance: "1,81,270.45",
    payin: "0.00",
    payout: "0.00",
    span: "24,800.00",
    deliveryMargin: "0.00",
    exposure: "13,620.00",
    optionsPremium: "0.00",
    collateralLiquid: "0.00",
    collateralEquity: "0.00",
    totalCollateral: "0.00",
  },
  commodity: {
    availableMargin: "0.00",
    usedMargin: "0.00",
    availableCash: "0.00",
    openingBalance: "0.00",
  },
};

export const notificationsList = [
  {
    id: 1,
    title: "Order Executed",
    description: "BUY 10 INFY @ 1845.00 executed at NSE successfully.",
    time: "10 mins ago",
    unread: true,
  },
  {
    id: 2,
    title: "Funds Credited",
    description: "₹50,000 added via UPI (Ref: 43289012345). Margin updated.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 3,
    title: "Mandate Approved",
    description: "IPO UPI Mandate for Swiggy Limited has been accepted.",
    time: "1 day ago",
    unread: false,
  },
];

export const initialBaskets = [
  { id: 1, name: "Nifty Bull Spread", itemsCount: 2, margin: "₹34,200" },
  { id: 2, name: "IT Long Term SIP", itemsCount: 3, margin: "₹18,500" },
];
