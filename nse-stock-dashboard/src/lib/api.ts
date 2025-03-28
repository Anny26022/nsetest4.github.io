import {
  ApiResponse,
  EquityDetails,
  EquityHistoricalData,
  GainersLosersData,
  MostActiveData,
  SymbolWithCompany,
} from '@/types/nse';
import useSWR, { SWRConfiguration } from 'swr';

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/nse',
  timeoutMs: 30000, // 30 seconds timeout
  retryCount: 3,
  retryDelay: 2000, // 2 seconds
};

// Production-ready fetch configuration
const fetchConfig: RequestInit = {
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to handle API responses with timeout
async function fetchWithTimeout(endpoint: string, config: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...fetchConfig,
      ...config,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Helper function to handle API responses
async function fetchAPI<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetchWithTimeout(endpoint);

    if (!response.ok) {
      // Handle specific HTTP errors
      switch (response.status) {
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 401:
          throw new Error('Authentication failed. Please check your credentials.');
        case 503:
          throw new Error('NSE API service is currently unavailable.');
        default:
          throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const json = await response.json() as ApiResponse<T>;

    if (!json.success) {
      throw new Error(json.error || 'An error occurred');
    }

    return json.data as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Generic fetcher function for SWR with proper typing
function createTypedFetcher<T>() {
  return (url: string) => fetchAPI<T>(url);
}

// Base SWR configuration with production settings
const baseConfig: Partial<SWRConfiguration> = {
  revalidateOnFocus: true,
  dedupingInterval: 2500,
  keepPreviousData: true,
  errorRetryCount: API_CONFIG.retryCount,
  onErrorRetry: (error: Error, key, config, revalidate, { retryCount }) => {
    // Don't retry on specific errors
    if (
      error.message?.includes('Rate limit exceeded') ||
      error.message?.includes('Authentication failed') ||
      error.message?.includes('NSE API service is currently unavailable')
    ) {
      return;
    }

    if (retryCount >= API_CONFIG.retryCount) {
      return;
    }

    // Exponential backoff with maximum delay
    setTimeout(() => revalidate({ retryCount }),
      Math.min(API_CONFIG.retryDelay * Math.pow(2, retryCount), 30000)
    );
  },
};

// Fetch symbols with SWR
export function useSymbols() {
  return useSWR<SymbolWithCompany[]>(
    `${API_CONFIG.baseUrl}/symbols`,
    createTypedFetcher<SymbolWithCompany[]>(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // Cache for 1 hour
    }
  );
}

// Fetch equity details with SWR
export function useEquityDetails(symbol: string) {
  return useSWR<EquityDetails>(
    symbol ? `${API_CONFIG.baseUrl}/equity/details?symbol=${symbol}` : null,
    createTypedFetcher<EquityDetails>(),
    {
      ...baseConfig,
      refreshInterval: 5000, // Refresh every 5 seconds
      refreshWhenHidden: true,
    }
  );
}

// Fetch historical data with SWR
export function useHistoricalData(
  symbol: string,
  startDate?: string,
  endDate?: string
) {
  let url = symbol ? `${API_CONFIG.baseUrl}/equity/historical?symbol=${symbol}` : null;

  if (url && startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  return useSWR<EquityHistoricalData>(
    url,
    createTypedFetcher<EquityHistoricalData>(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // Cache for 1 hour
    }
  );
}

// Fetch gainers and losers with SWR
export function useGainersLosers(index: string = 'NIFTY 50') {
  return useSWR<GainersLosersData>(
    `${API_CONFIG.baseUrl}/helpers/gainers-losers?index=${index}`,
    createTypedFetcher<GainersLosersData>(),
    {
      ...baseConfig,
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );
}

// Fetch most active equities with SWR
export function useMostActive(index: string = 'NIFTY 50') {
  return useSWR<MostActiveData>(
    `${API_CONFIG.baseUrl}/helpers/most-active?index=${index}`,
    createTypedFetcher<MostActiveData>(),
    {
      ...baseConfig,
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );
}

// Hook for market status
export function useMarketStatus() {
  return useSWR<{
    isOpen: boolean;
    nextMarketTime: string;
    nextTimeType: 'open' | 'close';
    serverTime: string;
  }>(
    `${API_CONFIG.baseUrl}/helpers/market-status`,
    createTypedFetcher<{
      isOpen: boolean;
      nextMarketTime: string;
      nextTimeType: 'open' | 'close';
      serverTime: string;
    }>(),
    {
      ...baseConfig,
      refreshInterval: 30000, // Check every 30 seconds
    }
  );
}

// New type for the all equity details response
export interface EquitySummary {
  symbol: string;
  companyName: string;
  tradingVolume?: number;
  tradedValue?: number;
  vwap?: number;
  peRatio?: number;
  lastPrice?: number;
  change?: number;
  pChange?: number;
  series?: string;
  error?: string;
}

// Fetch multiple equity details with SWR
export function useAllEquityDetails(symbols?: string[], limit?: number) {
  let url = `${API_CONFIG.baseUrl}/equity/all-details`;

  if (symbols?.length) {
    url += `?symbols=${symbols.join(',')}`;
  } else if (limit) {
    url += `?limit=${limit}`;
  }

  return useSWR<EquitySummary[]>(url, createTypedFetcher<EquitySummary[]>(), {
    revalidateOnFocus: false,
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

// Original direct fetch functions (for cases where SWR is not suitable)

// Fetch all stock symbols
export async function fetchSymbols(): Promise<SymbolWithCompany[]> {
  return fetchAPI<SymbolWithCompany[]>(`${API_CONFIG.baseUrl}/symbols`);
}

// Fetch equity details
export async function fetchEquityDetails(symbol: string): Promise<EquityDetails> {
  return fetchAPI<EquityDetails>(`${API_CONFIG.baseUrl}/equity/details?symbol=${symbol}`);
}

// Fetch historical data
export async function fetchHistoricalData(
  symbol: string,
  startDate?: string,
  endDate?: string
): Promise<EquityHistoricalData> {
  let url = `${API_CONFIG.baseUrl}/equity/historical?symbol=${symbol}`;

  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  return fetchAPI<EquityHistoricalData>(url);
}

// Fetch intraday data
export async function fetchIntradayData(symbol: string, isPreOpen?: boolean): Promise<any> {
  let url = `${API_CONFIG.baseUrl}/equity/intraday?symbol=${symbol}`;

  if (isPreOpen) {
    url += `&isPreOpen=true`;
  }

  return fetchAPI<any>(url);
}

// Fetch index details
export async function fetchIndexDetails(index: string): Promise<any> {
  return fetchAPI<any>(`${API_CONFIG.baseUrl}/index/details?index=${index}`);
}

// Fetch index historical data
export async function fetchIndexHistoricalData(
  index: string,
  startDate: string,
  endDate: string
): Promise<any> {
  return fetchAPI<any>(
    `${API_CONFIG.baseUrl}/index/historical?index=${index}&startDate=${startDate}&endDate=${endDate}`
  );
}

// Fetch gainers and losers
export async function fetchGainersLosers(index: string = 'NIFTY 50'): Promise<GainersLosersData> {
  return fetchAPI<GainersLosersData>(`${API_CONFIG.baseUrl}/helpers/gainers-losers?index=${index}`);
}

// Fetch most active equities
export async function fetchMostActive(index: string = 'NIFTY 50'): Promise<MostActiveData> {
  return fetchAPI<MostActiveData>(`${API_CONFIG.baseUrl}/helpers/most-active?index=${index}`);
}

// Fetch all equity details
export async function fetchAllEquityDetails(symbols?: string[], limit?: number): Promise<EquitySummary[]> {
  let url = `${API_CONFIG.baseUrl}/equity/all-details`;

  if (symbols?.length) {
    url += `?symbols=${symbols.join(',')}`;
  } else if (limit) {
    url += `?limit=${limit}`;
  }

  return fetchAPI<EquitySummary[]>(url);
}

// Export the configuration for use in other parts of the app
export const apiConfig = API_CONFIG;
