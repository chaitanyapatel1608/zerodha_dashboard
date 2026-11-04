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
  {
    "symbol": "JIO",
    "name": "Reliance Jio Infocomm Limited",
    "dates": "18 Nov - 21 Nov 2024",
    "priceRange": "₹450 - ₹475",
    "minQty": 31,
    "minAmount": "₹14,725",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "NSE",
    "name": "National Stock Exchange of India Limited",
    "dates": "20 Nov - 23 Nov 2024",
    "priceRange": "₹3,150 - ₹3,300",
    "minQty": 4,
    "minAmount": "₹13,200",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "SWIGGY",
    "name": "Swiggy Limited",
    "dates": "06 Nov - 08 Nov 2024",
    "priceRange": "₹371 - ₹390",
    "minQty": 38,
    "minAmount": "₹14,820",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ACME",
    "name": "ACME Solar Holdings Limited",
    "dates": "06 Nov - 08 Nov 2024",
    "priceRange": "₹275 - ₹289",
    "minQty": 51,
    "minAmount": "₹14,739",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "SAGILITY",
    "name": "Sagility India Limited",
    "dates": "05 Nov - 07 Nov 2024",
    "priceRange": "₹28 - ₹30",
    "minQty": 500,
    "minAmount": "₹15,000",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "NIVABUPA",
    "name": "Niva Bupa Health Insurance Company",
    "dates": "07 Nov - 11 Nov 2024",
    "priceRange": "₹70 - ₹74",
    "minQty": 200,
    "minAmount": "₹14,800",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ENVIRO",
    "name": "Enviro Infra Engineers Limited",
    "dates": "22 Nov - 26 Nov 2024",
    "priceRange": "₹140 - ₹148",
    "minQty": 101,
    "minAmount": "₹14,948",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ZINKA",
    "name": "Zinka Logistics Solution (BlackBuck)",
    "dates": "13 Nov - 18 Nov 2024",
    "priceRange": "₹259 - ₹273",
    "minQty": 54,
    "minAmount": "₹14,742",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "SURAKSHA",
    "name": "Suraksha Diagnostic Limited",
    "dates": "29 Nov - 03 Dec 2024",
    "priceRange": "₹420 - ₹441",
    "minQty": 34,
    "minAmount": "₹14,994",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "RAJESH",
    "name": "Rajesh Power Services Limited",
    "dates": "25 Nov - 27 Nov 2024",
    "priceRange": "₹319 - ₹335",
    "minQty": 44,
    "minAmount": "₹14,740",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "PREMIERENE",
    "name": "Premier Energies Limited",
    "dates": "10 Nov - 14 Nov 2024",
    "priceRange": "₹427 - ₹450",
    "minQty": 33,
    "minAmount": "₹14,850",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "KRNHEAT",
    "name": "KRN Heat Exchanger & Refrigeration",
    "dates": "11 Nov - 14 Nov 2024",
    "priceRange": "₹209 - ₹220",
    "minQty": 65,
    "minAmount": "₹14,300",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "DIFFUSION",
    "name": "Diffusion Engineers Limited",
    "dates": "12 Nov - 15 Nov 2024",
    "priceRange": "₹159 - ₹168",
    "minQty": 88,
    "minAmount": "₹14,784",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "GARUDA",
    "name": "Garuda Construction and Engineering",
    "dates": "12 Nov - 15 Nov 2024",
    "priceRange": "₹92 - ₹95",
    "minQty": 157,
    "minAmount": "₹14,915",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "MANBA",
    "name": "Manba Finance Limited",
    "dates": "13 Nov - 16 Nov 2024",
    "priceRange": "₹114 - ₹120",
    "minQty": 125,
    "minAmount": "₹15,000",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "NORTHARC",
    "name": "Northern Arc Capital Limited",
    "dates": "14 Nov - 18 Nov 2024",
    "priceRange": "₹249 - ₹263",
    "minQty": 57,
    "minAmount": "₹14,991",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "WESTERN",
    "name": "Western Carriers (India) Limited",
    "dates": "15 Nov - 19 Nov 2024",
    "priceRange": "₹163 - ₹172",
    "minQty": 87,
    "minAmount": "₹14,964",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ARKADE",
    "name": "Arkade Developers Limited",
    "dates": "15 Nov - 19 Nov 2024",
    "priceRange": "₹121 - ₹128",
    "minQty": 110,
    "minAmount": "₹14,080",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "TOLINS",
    "name": "Tolins Tyres Limited",
    "dates": "16 Nov - 20 Nov 2024",
    "priceRange": "₹215 - ₹226",
    "minQty": 66,
    "minAmount": "₹14,916",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "KROSS",
    "name": "Kross Limited",
    "dates": "16 Nov - 20 Nov 2024",
    "priceRange": "₹228 - ₹240",
    "minQty": 62,
    "minAmount": "₹14,880",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "GALAPREC",
    "name": "Gala Precision Engineering Limited",
    "dates": "17 Nov - 21 Nov 2024",
    "priceRange": "₹503 - ₹529",
    "minQty": 28,
    "minAmount": "₹14,812",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ECOS",
    "name": "ECOS (India) Mobility & Hospitality",
    "dates": "18 Nov - 21 Nov 2024",
    "priceRange": "₹318 - ₹334",
    "minQty": 44,
    "minAmount": "₹14,696",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ORIENTTECH",
    "name": "Orient Technologies Limited",
    "dates": "18 Nov - 22 Nov 2024",
    "priceRange": "₹195 - ₹206",
    "minQty": 72,
    "minAmount": "₹14,832",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "INTERARCH",
    "name": "Interarch Building Products Limited",
    "dates": "19 Nov - 22 Nov 2024",
    "priceRange": "₹850 - ₹900",
    "minQty": 16,
    "minAmount": "₹14,400",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "SARASWATI",
    "name": "Saraswati Saree Depot Limited",
    "dates": "19 Nov - 22 Nov 2024",
    "priceRange": "₹152 - ₹160",
    "minQty": 90,
    "minAmount": "₹14,400",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "UNICOMM",
    "name": "Unicommerce eSolutions Limited",
    "dates": "20 Nov - 25 Nov 2024",
    "priceRange": "₹102 - ₹108",
    "minQty": 138,
    "minAmount": "₹14,904",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "FIRSTCRY",
    "name": "Brainbees Solutions Limited (FirstCry)",
    "dates": "20 Nov - 25 Nov 2024",
    "priceRange": "₹440 - ₹465",
    "minQty": 32,
    "minAmount": "₹14,880",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "OLAELEC",
    "name": "Ola Electric Mobility Limited",
    "dates": "21 Nov - 26 Nov 2024",
    "priceRange": "₹72 - ₹76",
    "minQty": 195,
    "minAmount": "₹14,820",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "CEIGALL",
    "name": "Ceigall India Limited",
    "dates": "21 Nov - 26 Nov 2024",
    "priceRange": "₹380 - ₹401",
    "minQty": 37,
    "minAmount": "₹14,837",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "AKUMS",
    "name": "Akums Drugs and Pharmaceuticals",
    "dates": "22 Nov - 27 Nov 2024",
    "priceRange": "₹646 - ₹679",
    "minQty": 22,
    "minAmount": "₹14,938",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "SANSTAR",
    "name": "Sanstar Limited",
    "dates": "22 Nov - 27 Nov 2024",
    "priceRange": "₹90 - ₹95",
    "minQty": 150,
    "minAmount": "₹14,250",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "BANSALWIRE",
    "name": "Bansal Wire Industries Limited",
    "dates": "23 Nov - 28 Nov 2024",
    "priceRange": "₹243 - ₹256",
    "minQty": 58,
    "minAmount": "₹14,848",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "EMCURE",
    "name": "Emcure Pharmaceuticals Limited",
    "dates": "24 Nov - 29 Nov 2024",
    "priceRange": "₹960 - ₹1,008",
    "minQty": 14,
    "minAmount": "₹14,112",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "ALLIED",
    "name": "Allied Blenders and Distillers Limited",
    "dates": "25 Nov - 29 Nov 2024",
    "priceRange": "₹267 - ₹281",
    "minQty": 53,
    "minAmount": "₹14,893",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "STANLEY",
    "name": "Stanley Lifestyles Limited",
    "dates": "26 Nov - 30 Nov 2024",
    "priceRange": "₹351 - ₹369",
    "minQty": 40,
    "minAmount": "₹14,760",
    "status": "Apply",
    "type": "IPO"
  },
  {
    "symbol": "NTPCGREEN",
    "name": "NTPC Green Energy Limited",
    "dates": "19 Nov - 22 Nov 2024",
    "priceRange": "₹102 - ₹108",
    "minQty": 138,
    "minAmount": "₹14,904",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "TATACAP",
    "name": "Tata Capital Limited",
    "dates": "10 Dec - 13 Dec 2024",
    "priceRange": "₹320 - ₹335",
    "minQty": 44,
    "minAmount": "₹14,740",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "HDBFS",
    "name": "HDB Financial Services Limited",
    "dates": "16 Dec - 19 Dec 2024",
    "priceRange": "₹720 - ₹750",
    "minQty": 20,
    "minAmount": "₹15,000",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "LGINEDIA",
    "name": "LG Electronics India Limited",
    "dates": "08 Jan - 11 Jan 2025",
    "priceRange": "₹1,120 - ₹1,180",
    "minQty": 12,
    "minAmount": "₹14,160",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "ATHER",
    "name": "Ather Energy Limited",
    "dates": "14 Jan - 17 Jan 2025",
    "priceRange": "₹310 - ₹328",
    "minQty": 45,
    "minAmount": "₹14,760",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "MOBIKWIK",
    "name": "One MobiKwik Systems Limited",
    "dates": "21 Jan - 24 Jan 2025",
    "priceRange": "₹265 - ₹279",
    "minQty": 53,
    "minAmount": "₹14,787",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "DEE",
    "name": "DEE Development Engineers Limited",
    "dates": "28 Jan - 31 Jan 2025",
    "priceRange": "₹193 - ₹203",
    "minQty": 73,
    "minAmount": "₹14,819",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "IXIGO",
    "name": "Le Travenues Technology (ixigo)",
    "dates": "03 Feb - 06 Feb 2025",
    "priceRange": "₹88 - ₹93",
    "minQty": 161,
    "minAmount": "₹14,973",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "AWFIS",
    "name": "Awfis Space Solutions Limited",
    "dates": "10 Feb - 13 Feb 2025",
    "priceRange": "₹364 - ₹383",
    "minQty": 39,
    "minAmount": "₹14,937",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "GODIGIT",
    "name": "Go Digit General Insurance Limited",
    "dates": "17 Feb - 20 Feb 2025",
    "priceRange": "₹258 - ₹272",
    "minQty": 55,
    "minAmount": "₹14,960",
    "status": "Pre-apply",
    "type": "IPO"
  },
  {
    "symbol": "HYUNDAI",
    "name": "Hyundai Motor India Limited",
    "dates": "15 Oct - 17 Oct 2024",
    "priceRange": "₹1,865 - ₹1,960",
    "minQty": 7,
    "minAmount": "₹13,720",
    "status": "Closed",
    "type": "IPO"
  },
  {
    "symbol": "WAARRE",
    "name": "Waaree Energies Limited",
    "dates": "21 Oct - 23 Oct 2024",
    "priceRange": "₹1,427 - ₹1,503",
    "minQty": 9,
    "minAmount": "₹13,527",
    "status": "Closed",
    "type": "IPO"
  },
  {
    "symbol": "AFCONS",
    "name": "Afcons Infrastructure Limited",
    "dates": "25 Oct - 29 Oct 2024",
    "priceRange": "₹440 - ₹463",
    "minQty": 32,
    "minAmount": "₹14,816",
    "status": "Closed",
    "type": "IPO"
  },
  {
    "symbol": "BAJAJHFL",
    "name": "Bajaj Housing Finance Limited",
    "dates": "09 Sep - 11 Sep 2024",
    "priceRange": "₹66 - ₹70",
    "minQty": 214,
    "minAmount": "₹14,980",
    "status": "Closed",
    "type": "IPO"
  },
  {
    "symbol": "TATATECH",
    "name": "Tata Technologies Limited",
    "dates": "22 Nov - 24 Nov 2023",
    "priceRange": "₹475 - ₹500",
    "minQty": 30,
    "minAmount": "₹15,000",
    "status": "Closed",
    "type": "IPO"
  }
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
