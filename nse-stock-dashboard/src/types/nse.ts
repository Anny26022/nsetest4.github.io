// Date Range
export interface DateRange {
  start: Date;
  end: Date;
}

// Equity Historical Data
export interface EquityHistoricalInfo {
  _id: string;
  CH_SYMBOL: string;
  CH_SERIES: string;
  CH_MARKET_TYPE: string;
  CH_TRADE_HIGH_PRICE: number;
  CH_TRADE_LOW_PRICE: number;
  CH_OPENING_PRICE: number;
  CH_CLOSING_PRICE: number;
  CH_LAST_TRADED_PRICE: number;
  CH_PREVIOUS_CLS_PRICE: number;
  CH_TOT_TRADED_QTY: number;
  CH_TOT_TRADED_VAL: number;
  CH_52WEEK_HIGH_PRICE: number;
  CH_52WEEK_LOW_PRICE: number;
  CH_TOTAL_TRADES: number | null;
  CH_ISIN: string;
  CH_TIMESTAMP: string;
  TIMESTAMP: string;
  VWAP: number;
}

export interface EquityHistoricalData {
  data: EquityHistoricalInfo[];
  meta: {
    fromDate: string;
    toDate: string;
    series: string[];
    symbols: string[];
  };
}

// Index Equity Info (for gainers, losers, most active)
export interface IndexEquityInfo {
  symbol: string;
  series: string;
  ltp: number;
  change: number;
  pChange: number;
  tradedQuantity: string;
  turnover: string;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
}

export interface GainersLosersData {
  gainers: IndexEquityInfo[];
  losers: IndexEquityInfo[];
}

export interface MostActiveData {
  byValue: IndexEquityInfo[];
  byVolume: IndexEquityInfo[];
}

// Equity Details
export interface EquityInfo {
  symbol: string;
  companyName: string;
  industry: string;
  listingDate: string;
  isin: string;
  isKeyinCandidate?: boolean;
  series: string;
  activeSeries?: string[];
  isFNOSec?: boolean;
  isSLBSec?: boolean;
  identifier?: string;
  pe?: number; // PE ratio can also be in info
}

export interface HighLowData {
  min: number;
  max: number;
  value: number;
  minDate?: string;
  maxDate?: string;
}

export interface EquityPriceInfo {
  lastPrice: number;
  change: number;
  pChange: number;
  previousClose: number;
  open: number;
  close: number;
  vwap: number;
  lowerCP?: string;
  upperCP?: string;
  pPriceBand?: string;
  basePrice?: number;
  intraDayHighLow?: HighLowData;
  weekHighLow?: HighLowData;
  high?: number;
  low?: number;
  totalTradedVolume?: number;
  totalTradedValue?: number;
}

export interface EquitySecurityInfo {
  boardStatus: string;
  tradingStatus: string;
  marketType?: string;
  instrumentType?: string;
  pe?: number; // PE ratio location in securityInfo
  marketCap?: number; // Market capitalization
  issuedSize?: string; // Total issued shares
  issuedCap?: number; // Issued capital
  faceValue?: number; // Face value of the stock
}

export interface EquityMetadata {
  series: string;
  symbol: string;
  isin: string;
  status: string;
  listingDate: string;
  industry: string;
  lastUpdateTime: string;
  pdSectorPe?: number;
  pdSymbolPe?: number; // PE ratio location in metadata
  totalTradedVolume?: string;
  totalTradedValue?: number; // Traded value in metadata
}

export interface EquityDetails {
  info: EquityInfo;
  priceInfo: EquityPriceInfo;
  securityInfo: EquitySecurityInfo;
  metadata: EquityMetadata;
  industryInfo?: {
    industry: string;
    macroSector?: string;
  };
  marketDeptOrderBook?: MarketDeptOrderBook; // Add this field
  sddDetails?: any;
  currentMarketType?: string;
  preOpenMarket?: any;
}

// Add marketDeptOrderBook interface which contains tradeInfo with volume data
export interface MarketDeptOrderBook {
  tradeInfo?: {
    totalTradedVolume?: number;
    totalTradedValue?: number;
    totalMarketCap?: number;
    ffmc?: number;
    impactCost?: number;
  };
  totalBuyQuantity?: number;
  totalSellQuantity?: number;
  bid?: Array<{price: number; quantity: number}>;
  ask?: Array<{price: number; quantity: number}>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Symbol with company name structure
export interface SymbolWithCompany {
  symbol: string;
  companyName: string;
}

// NSE API Stock Data
export interface NseStockData {
  symbol: string;
  identifier?: string;
  series?: string;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  lastPrice?: number;
  previousClose?: number;
  change?: number;
  pChange?: number;
  totalTradedVolume?: string | number;
  totalTradedValue?: string | number;
  lastUpdateTime?: string;
  yearHigh?: number;
  yearLow?: number;
  perChange365d?: number;
  perChange30d?: number;
  // Alternative field names
  ltp?: number;
  high?: number;
  low?: number;
  turnover?: string | number;
  tradedQuantity?: string | number;
  volume?: string | number;  // Some APIs return volume instead of tradedQuantity
}

// NSE API Response
export interface NseApiResponse {
  data?: NseStockData[];
  timestamp?: string;
  error?: string;
}

// NSE India Class Type
export interface NseIndia {
  getGainers(): Promise<NseApiResponse>;
  getLosers(): Promise<NseApiResponse>;
  getMostActive(): Promise<NseApiResponse>;
  getEquityStockIndices(index: string): Promise<NseApiResponse>;
  getEquityDetails(symbol: string): Promise<any>;
  getEquityHistoricalData(symbol: string, from: Date, to: Date): Promise<EquityHistoricalData>;
}
