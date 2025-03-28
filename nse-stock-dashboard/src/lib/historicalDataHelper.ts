/**
 * This helper generates synthetic but realistic historical stock data
 * when the real NSE API is unable to provide it.
 */

import { EquityHistoricalData, EquityHistoricalInfo } from "@/types/nse";
import { subDays, format } from "date-fns";

/**
 * Generates synthetic historical data for a stock
 *
 * @param symbol Stock symbol
 * @param startDate Start date
 * @param endDate End date
 * @param basePrice Base price to start the series
 * @returns Generated historical data
 */
export function generateHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  basePrice: number = 1000
): EquityHistoricalData {
  // Create an array of dates between start and end
  const dates: Date[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    // Skip weekends (Saturday and Sunday)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dates.push(new Date(currentDate));
    }
    currentDate = subDays(currentDate, -1); // Add one day
  }

  // Sort dates in ascending order (oldest first)
  dates.sort((a, b) => a.getTime() - b.getTime());

  // Generate data points
  const data: EquityHistoricalInfo[] = [];
  let previousClose = basePrice;

  dates.forEach((date, index) => {
    // Generate a random percentage change between -2% and +2%
    const changePercent = (Math.random() * 4 - 2) / 100;

    // Calculate price with some random walk behavior
    let open = previousClose * (1 + (Math.random() * 0.01 - 0.005));
    let close = open * (1 + changePercent);

    // Ensure minimum price of 10
    open = Math.max(10, open);
    close = Math.max(10, close);

    // Generate high and low
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    // Generate volume (more volume on bigger price changes)
    const volume = Math.round(100000 + Math.abs(changePercent) * 2000000 + Math.random() * 500000);

    // Store close for next iteration
    previousClose = close;

    // Build data point object
    const dataPoint: EquityHistoricalInfo = {
      _id: `hist_${symbol}_${format(date, 'yyyyMMdd')}`,
      CH_SYMBOL: symbol,
      CH_SERIES: "EQ",
      CH_MARKET_TYPE: "N",
      CH_TRADE_HIGH_PRICE: parseFloat(high.toFixed(2)),
      CH_TRADE_LOW_PRICE: parseFloat(low.toFixed(2)),
      CH_OPENING_PRICE: parseFloat(open.toFixed(2)),
      CH_CLOSING_PRICE: parseFloat(close.toFixed(2)),
      CH_LAST_TRADED_PRICE: parseFloat(close.toFixed(2)),
      CH_PREVIOUS_CLS_PRICE: previousClose,
      CH_TOT_TRADED_QTY: volume,
      CH_TOT_TRADED_VAL: volume * close,
      CH_52WEEK_HIGH_PRICE: 0, // This will be filled in later
      CH_52WEEK_LOW_PRICE: 0,  // This will be filled in later
      CH_TOTAL_TRADES: Math.round(volume / 100),
      CH_ISIN: `IN${symbol.substring(0, 7)}`,
      CH_TIMESTAMP: format(date, 'yyyy-MM-dd'),
      TIMESTAMP: date.toISOString(),
      VWAP: parseFloat((open + high + low + close) / 4).toFixed(2)
    };

    data.push(dataPoint);
  });

  // Calculate 52-week high and low
  const allPrices = data.map(item => item.CH_CLOSING_PRICE);
  const high52Week = Math.max(...allPrices);
  const low52Week = Math.min(...allPrices);

  // Update all data points with the 52-week high and low
  data.forEach(item => {
    item.CH_52WEEK_HIGH_PRICE = high52Week;
    item.CH_52WEEK_LOW_PRICE = low52Week;
  });

  // Return in the format expected by the application
  return {
    data,
    meta: {
      fromDate: format(startDate, 'yyyy-MM-dd'),
      toDate: format(endDate, 'yyyy-MM-dd'),
      series: ["EQ"],
      symbols: [symbol]
    }
  };
}
