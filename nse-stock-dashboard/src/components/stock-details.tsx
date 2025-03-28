import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquityDetails } from '@/lib/api';
import { EquityDetails as EquityDetailsType } from '@/types/nse';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Info,
  Layers,
  TrendingUp,
  Calendar,
  Gauge,
  BarChart3,
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Percent,
  BarChart4
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PriceTicker } from './price-ticker';
import React from 'react';
import TradingViewChart from './trading-view-chart';

interface StockDetailsProps {
  symbol: string;
}

export function StockDetails({ symbol }: StockDetailsProps) {
  const { data: details, error, isLoading } = useEquityDetails(symbol);

  // Debug logging when data is received
  React.useEffect(() => {
    if (details) {
      console.log('StockDetails - Full API response:', details);

      // Log volume data locations
      console.log('Volume data locations:', {
        priceInfoVolume: details.priceInfo?.totalTradedVolume,
        metadataVolume: details.metadata?.totalTradedVolume,
        marketDeptOrderBookVolume: details.marketDeptOrderBook?.tradeInfo?.totalTradedVolume,
        tradeInfoVolume: details.tradeInfo?.marketDeptOrderBook?.tradeInfo?.totalTradedVolume,
        securityWiseDPVolume: details.tradeInfo?.securityWiseDP?.quantityTraded
      });

      // Log traded value locations
      console.log('Traded value locations:', {
        priceInfoValue: details.priceInfo?.totalTradedValue,
        metadataValue: details.metadata?.totalTradedValue,
        marketDeptOrderBookValue: details.marketDeptOrderBook?.tradeInfo?.totalTradedValue,
        tradeInfoValue: details.tradeInfo?.marketDeptOrderBook?.tradeInfo?.totalTradedValue
      });

      // Log PE ratio locations
      console.log('PE ratio locations:', {
        securityInfoPE: details.securityInfo?.pe,
        metadataPdSymbolPe: details.metadata?.pdSymbolPe,
        metadataPdSectorPe: details.metadata?.pdSectorPe,
        infoPE: details.info?.pe
      });

      // Log VWAP
      console.log('VWAP:', {
        priceInfoVWAP: details.priceInfo?.vwap,
        marketDeptOrderBookVWAP: details.marketDeptOrderBook?.tradeInfo?.vwap
      });
    }
  }, [details]);

  if (!symbol) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Details</CardTitle>
          <CardDescription>Search and select a stock to see details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40 text-muted-foreground">
            No stock selected
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatIndianCurrency = (num: number | string | undefined) => {
    if (num === undefined || num === null) return '₹0.00';

    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '₹0.00';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // Format market cap in crores/lakhs
  const formatMarketCap = (mcap: number | string | undefined) => {
    if (mcap === undefined || mcap === null) return 'N/A';

    const numValue = typeof mcap === 'string' ? parseFloat(mcap) : mcap;
    if (isNaN(numValue)) return 'N/A';

    // Special case for NSE India API which sometimes returns values already in crores
    // If the value is relatively small (< 10000), it's likely already in crores
    if (numValue < 10000) {
      return `₹${numValue.toFixed(2)} Cr`;
    }

    // For other cases, we need to convert from raw values to crores
    // In the Indian numbering system: 1 crore = 10,000,000
    if (numValue >= 10000000) {
      return `₹${(numValue / 10000000).toFixed(2)} Cr`;
    } else if (numValue >= 100000) {
      return `₹${(numValue / 100000).toFixed(2)} L`;
    } else {
      return `₹${numValue.toFixed(2)}`;
    }
  };

  // Safety checks for the data
  const hasValidData = details &&
                      details.info &&
                      details.priceInfo &&
                      typeof details.priceInfo.lastPrice === 'number';

  // Safe getters for potentially undefined values
  const getChange = () => {
    if (!details || !details.priceInfo) return 0;
    return typeof details.priceInfo.change === 'number' ? details.priceInfo.change : 0;
  };

  const getPChange = () => {
    if (!details || !details.priceInfo) return 0;
    return typeof details.priceInfo.pChange === 'number' ? details.priceInfo.pChange : 0;
  };

  // Get 52 week high from weekHighLow
  const get52WeekHigh = () => {
    if (!details?.priceInfo?.weekHighLow?.max) return 0;
    return details.priceInfo.weekHighLow.max;
  };

  // Get 52 week low from weekHighLow
  const get52WeekLow = () => {
    if (!details?.priceInfo?.weekHighLow?.min) return 0;
    return details.priceInfo.weekHighLow.min;
  };

  // Get intraday high
  const getIntradayHigh = () => {
    if (!details?.priceInfo?.intraDayHighLow?.max) return 0;
    return details.priceInfo.intraDayHighLow.max;
  };

  // Get intraday low
  const getIntradayLow = () => {
    if (!details?.priceInfo?.intraDayHighLow?.min) return 0;
    return details.priceInfo.intraDayHighLow.min;
  };

  // Get price band
  const getPriceBand = () => {
    if (!details?.priceInfo?.pPriceBand) return 'N/A';
    return details.priceInfo.pPriceBand;
  };

  // Get market cap
  const getMarketCap = () => {
    if (details?.securityInfo?.marketCap) {
      return details.securityInfo.marketCap;
    }

    // Calculate market cap if not directly available
    if (details?.securityInfo?.issuedSize && details?.priceInfo?.lastPrice) {
      const issuedSize = typeof details.securityInfo.issuedSize === 'string' 
        ? parseFloat(details.securityInfo.issuedSize) 
        : details.securityInfo.issuedSize;
      const lastPrice = details.priceInfo.lastPrice;
      if (!isNaN(issuedSize) && !isNaN(lastPrice)) {
        return issuedSize * lastPrice;
      }
    }
    return undefined;
  };

  // Get P/E ratio - improved version
  const getPERatio = () => {
    // Check all possible locations where PE ratio might be stored

    // First check securityInfo which has the most reliable PE data
    if (details?.securityInfo?.pe !== undefined && details.securityInfo.pe !== null) {
      return details.securityInfo.pe;
    }

    // Then check metadata
    if (details?.metadata?.pdSymbolPe !== undefined && details.metadata.pdSymbolPe !== null) {
      return details.metadata.pdSymbolPe;
    }

    // Then check sector PE in metadata
    if (details?.metadata?.pdSectorPe !== undefined && details.metadata.pdSectorPe !== null) {
      return details.metadata.pdSectorPe;
    }

    // Finally check info object
    if (details?.info?.pe !== undefined && details.info.pe !== null) {
      return details.info.pe;
    }

    return undefined;
  };

  // Format P/E ratio - handle cases where it's displayed in rupees instead of ratio
  const formatPERatio = (pe: number | string | undefined) => {
    if (pe === undefined || pe === null) return 'N/A';

    const numValue = typeof pe === 'string' ? parseFloat(pe) : pe;
    if (isNaN(numValue)) return 'N/A';

    // If PE is extremely large (likely in rupees instead of ratio)
    if (numValue > 1000) {
      // Convert to crores
      if (numValue >= 10000000) { // 1 crore = 10,000,000
        return `₹${(numValue / 10000000).toFixed(2)} Cr`;
      } else if (numValue >= 100000) { // 1 lakh = 100,000
        return `₹${(numValue / 100000).toFixed(2)} L`;
      } else {
        return `₹${numValue.toFixed(2)}`;
      }
    }

    // Normal PE ratio case
    return numValue.toFixed(2);
  };

  // Get sector
  const getSector = () => {
    if (details?.industryInfo?.macro) {
      return details.industryInfo.macro;
    }
    // Fallback to industry if sector is not available
    if (details?.info?.industry) {
      return details.info.industry;
    }
    return undefined;
  };

  // Calculate position on 52-week range
  const calculate52WeekPosition = () => {
    const high = get52WeekHigh();
    const low = get52WeekLow();
    const current = details?.priceInfo?.lastPrice || 0;

    if (high <= low || current <= low) return 0;
    if (current >= high) return 100;

    return Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));
  };

  // Calculate position on today's range
  const calculateTodayRangePosition = () => {
    const high = getIntradayHigh();
    const low = getIntradayLow();
    const current = details?.priceInfo?.lastPrice || 0;

    if (high <= low || current <= low) return 0;
    if (current >= high) return 100;

    return Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));
  };

  // Format dates from API - convert from DD-MMM-YYYY to localized format
  const formatApiDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      // Parse DD-MMM-YYYY format (e.g., "17-Mar-2025")
      const parts = dateString.split('-');
      const months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
      const day = parseInt(parts[0], 10);
      const month = months[parts[1] as keyof typeof months];
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || month === undefined || isNaN(year)) {
        return dateString; // Return original if parsing fails
      }

      const date = new Date(year, month, day);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString; // Return original if conversion fails
    }
  };

  // Get total traded quantity - improved version
  const getTotalTradedQuantity = () => {
    // Check in trade info data first (most complete)
    if (details?.tradeInfo?.marketDeptOrderBook?.tradeInfo?.totalTradedVolume) {
      return details.tradeInfo.marketDeptOrderBook.tradeInfo.totalTradedVolume;
    }

    // Then check in direct marketDeptOrderBook
    if (details?.marketDeptOrderBook?.tradeInfo?.totalTradedVolume) {
      return details.marketDeptOrderBook.tradeInfo.totalTradedVolume;
    }

    // Then check security wise delivery position in trade info
    if (details?.tradeInfo?.securityWiseDP?.quantityTraded) {
      return details.tradeInfo.securityWiseDP.quantityTraded;
    }

    // Then check metadata
    if (details?.metadata?.totalTradedVolume) {
      // Handle string values
      return typeof details.metadata.totalTradedVolume === 'string'
        ? parseInt(details.metadata.totalTradedVolume, 10)
        : details.metadata.totalTradedVolume;
    }

    // Finally check priceInfo
    if (details?.priceInfo?.totalTradedVolume) {
      return details.priceInfo.totalTradedVolume;
    }

    return undefined;
  };

  // Get total traded value - improved version
  const getTotalTradedValue = () => {
    // Check in trade info data first (most complete)
    if (details?.tradeInfo?.marketDeptOrderBook?.tradeInfo?.totalTradedValue) {
      return details.tradeInfo.marketDeptOrderBook.tradeInfo.totalTradedValue;
    }

    // Then check in direct marketDeptOrderBook
    if (details?.marketDeptOrderBook?.tradeInfo?.totalTradedValue) {
      return details.marketDeptOrderBook.tradeInfo.totalTradedValue;
    }

    // Then check metadata
    if (details?.metadata?.totalTradedValue) {
      return details.metadata.totalTradedValue;
    }

    // Finally check priceInfo
    if (details?.priceInfo?.totalTradedValue) {
      return details.priceInfo.totalTradedValue;
    }

    return undefined;
  };

  // Get VWAP - new function
  const getVWAP = () => {
    if (details?.priceInfo?.vwap !== undefined && details.priceInfo.vwap !== null) {
      return details.priceInfo.vwap;
    }

    // Check any other potential VWAP locations
    if (details?.marketDeptOrderBook?.tradeInfo?.vwap !== undefined) {
      return details.marketDeptOrderBook.tradeInfo.vwap;
    }

    return undefined;
  };

  // Format volume/quantity number
  const formatLargeNumber = (num: number | string | undefined) => {
    if (num === undefined || num === null) return 'N/A';

    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';

    return new Intl.NumberFormat('en-IN').format(numValue);
  };

  // Format value in crores
  const formatTradeValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) return 'N/A';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';

    // If the value is already in crores (relatively small number)
    if (numValue < 10000) {
      return `₹${numValue.toFixed(2)} Cr`;
    }

    // Convert from raw value to crores
    return `₹${(numValue / 10000000).toFixed(2)} Cr`;
  };

  return (
    <div className="space-y-4">
      {/* Stock Details Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {isLoading ? <Skeleton className="h-8 w-[150px]" /> : details?.info?.symbol}
              </CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-[250px] mt-1" /> : details?.info?.companyName}
              </CardDescription>
            </div>
            {!isLoading && hasValidData && (
              <Badge className={getChange() >= 0 ? 'bg-green-500' : 'bg-red-500'}>
                <div className="flex items-center">
                  {getChange() >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {getPChange().toFixed(2)}%
                </div>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">Failed to load stock details</div>
          ) : hasValidData ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">
                  <PriceTicker
                    price={details.priceInfo.lastPrice}
                    formatFn={formatIndianCurrency}
                  />
                </div>
                <div className={getChange() >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {getChange() >= 0 ? '+' : ''}
                  {getChange().toFixed(2)} ({getPChange().toFixed(2)}%)
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <BarChart4 className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Key Metrics</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <CircleDollarSign className="h-3 w-3 mr-1" />
                      Market Cap
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {formatMarketCap(getMarketCap())}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      P/E Ratio
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {formatPERatio(getPERatio())}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      Sector
                    </div>
                    <div className="text-sm font-medium mt-1 truncate">
                      {getSector() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trading Ranges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Layers className="h-4 w-4 mr-1" />
                    Today's Range
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>{formatIndianCurrency(getIntradayLow())}</div>
                    <div>{formatIndianCurrency(getIntradayHigh())}</div>
                  </div>
                  <div className="w-full bg-secondary h-1 mt-2 rounded-full overflow-hidden">
                    {getIntradayHigh() > getIntradayLow() && (
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${calculateTodayRangePosition()}%` }}
                      ></div>
                    )}
                  </div>
                </div>

                <div className="bg-secondary/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Previous Close
                  </div>
                  <div className="mt-1">{formatIndianCurrency(details.priceInfo.previousClose)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(details.priceInfo.previousClose || 0) < (details.priceInfo.lastPrice || 0) ? 'Up' : 'Down'} from yesterday
                  </div>
                </div>
              </div>

              {/* Volume Info */}
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Volume Information</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Trading Volume</div>
                    <div className="text-lg font-medium">
                      {formatLargeNumber(getTotalTradedQuantity())}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Traded Value</div>
                    <div className="text-lg font-medium">
                      {formatTradeValue(getTotalTradedValue())}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">VWAP</div>
                    <div className="text-lg font-medium">
                      {getVWAP() !== undefined ? formatIndianCurrency(getVWAP()) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 52 Week Range */}
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    52 Week Range
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatIndianCurrency(get52WeekLow())} - {formatIndianCurrency(get52WeekHigh())}
                  </div>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full",
                      getChange() >= 0 ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${calculate52WeekPosition()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <div>52W Low ({formatApiDate(details.priceInfo.weekHighLow?.minDate)})</div>
                  <div>Current: {formatIndianCurrency(details.priceInfo.lastPrice)}</div>
                  <div>52W High ({formatApiDate(details.priceInfo.weekHighLow?.maxDate)})</div>
                </div>
              </div>

              {/* Industry Information */}
              {details.info.industry && (
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Gauge className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Industry: {details.info.industry}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground">
                    Industry classification provided by National Stock Exchange of India
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Could not load stock details. Please try again.</div>
          )}
        </CardContent>
      </Card>

      {/* TradingView Chart */}
      <div className="relative w-full overflow-hidden">
        <Card className="p-0 shadow-none border-0 rounded-none w-full">
          <div style={{ height: "600px", width: "100vw", maxWidth: "100%" }}>
            <TradingViewChart 
              symbol={symbol} 
              autosize={true}
              theme="light" 
              exchange="NSE"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
