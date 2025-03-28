import { EquityHistoricalInfo } from '@/types/nse';

/**
 * Calculate EMA (Exponential Moving Average) from price data
 * @param data Array of price data
 * @param period EMA period
 * @param priceField Field to use from price data (default: CH_CLOSING_PRICE)
 * @returns Array of EMA values
 */
export function calculateEMA(
  data: EquityHistoricalInfo[],
  period: number,
  priceField: keyof EquityHistoricalInfo = 'CH_CLOSING_PRICE'
): number[] {
  if (!data || data.length === 0 || period <= 0) {
    return [];
  }

  // Sort data by date (oldest first)
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.CH_TIMESTAMP || a.TIMESTAMP || '');
    const dateB = new Date(b.CH_TIMESTAMP || b.TIMESTAMP || '');
    return dateA.getTime() - dateB.getTime();
  });

  // Get price values from data
  const prices = sortedData.map(item => {
    const value = item[priceField];
    return typeof value === 'number' ? value : 0;
  });

  // Calculate EMAs
  const emaValues: number[] = [];
  const k = 2 / (period + 1); // Smoothing factor for EMA

  // Initial EMA is the SMA (Simple Moving Average) for the first 'period' elements
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  emaValues.push(ema);

  // Calculate EMA for remaining prices
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
    emaValues.push(ema);
  }

  // Pad the beginning with nulls to match the length of the input data
  const padding = Array(period - 1).fill(null);
  return [...padding, ...emaValues];
}

/**
 * Check if the current price is above or below an EMA
 * @param currentPrice Current price
 * @param emaValue EMA value
 * @returns 'above' | 'below' | null
 */
export function priceRelationToEMA(currentPrice: number, emaValue: number | null): 'above' | 'below' | null {
  if (emaValue === null || isNaN(emaValue)) return null;
  return currentPrice > emaValue ? 'above' : 'below';
}

/**
 * Calculate all required EMAs for scanner
 * @param historicalData Historical price data
 * @returns Object with all calculated EMAs
 */
export function calculateAllEMAs(historicalData: EquityHistoricalInfo[]) {
  if (!historicalData || historicalData.length === 0) {
    return {
      ema10: [],
      ema20: [],
      ema50: [],
      ema200: [],
      currentPrice: 0,
      currentEma10: null,
      currentEma20: null,
      currentEma50: null,
      currentEma200: null,
    };
  }

  // Calculate EMAs
  const ema10 = calculateEMA(historicalData, 10);
  const ema20 = calculateEMA(historicalData, 20);
  const ema50 = calculateEMA(historicalData, 50);
  const ema200 = calculateEMA(historicalData, 200);

  // Sort data to get the latest price
  const sortedData = [...historicalData].sort((a, b) => {
    const dateA = new Date(a.CH_TIMESTAMP || a.TIMESTAMP || '');
    const dateB = new Date(b.CH_TIMESTAMP || b.TIMESTAMP || '');
    return dateB.getTime() - dateA.getTime(); // Latest first
  });

  // Get latest price and EMAs
  const currentPrice = sortedData[0]?.CH_CLOSING_PRICE || 0;
  const currentEma10 = ema10[ema10.length - 1];
  const currentEma20 = ema20[ema20.length - 1];
  const currentEma50 = ema50[ema50.length - 1];
  const currentEma200 = ema200[ema200.length - 1];

  return {
    ema10,
    ema20,
    ema50,
    ema200,
    currentPrice,
    currentEma10,
    currentEma20,
    currentEma50,
    currentEma200,
  };
}

/**
 * Interface for EMA scan results
 */
export interface EmaScanResult {
  symbol: string;
  companyName: string;
  currentPrice: number;
  ema10: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  relationToEma10: 'above' | 'below' | null;
  relationToEma20: 'above' | 'below' | null;
  relationToEma50: 'above' | 'below' | null;
  relationToEma200: 'above' | 'below' | null;
}
