import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHistoricalData } from '@/lib/api';
import { EquityHistoricalInfo } from '@/types/nse';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, subMonths, subYears, startOfYear } from 'date-fns';
import { Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  const [period, setPeriod] = useState<'1D' | '5D' | '1M' | '6M' | 'YTD' | '5Y'>('1M');
  const [retryCount, setRetryCount] = useState(0);

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case '1D':
        startDate = subDays(endDate, 1);
        break;
      case '5D':
        startDate = subDays(endDate, 5);
        break;
      case '1M':
        startDate = subMonths(endDate, 1);
        break;
      case '6M':
        startDate = subMonths(endDate, 6);
        break;
      case 'YTD':
        startDate = startOfYear(endDate);
        break;
      case '5Y':
        startDate = subYears(endDate, 5);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  }, [period]);

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useHistoricalData(
    symbol,
    dateRange.startDate,
    dateRange.endDate
  );

  // Retry fetching on error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        mutate();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, mutate]);

  // Process the data for the chart
  const formattedData = useMemo(() => {
    if (!data || !data.data || !Array.isArray(data.data)) return [];

    // If data array is empty, return empty array
    if (data.data.length === 0) return [];

    try {
      // Sort by date (oldest to newest)
      const sortedData = [...data.data].sort((a, b) => {
        const dateA = new Date(a.CH_TIMESTAMP || a.TIMESTAMP || '');
        const dateB = new Date(b.CH_TIMESTAMP || b.TIMESTAMP || '');
        return dateA.getTime() - dateB.getTime();
      });

      return sortedData.map((item) => {
        // Extract date (handle multiple possible date fields)
        const dateString = item.CH_TIMESTAMP || item.TIMESTAMP || '';
        let dateObj: Date;
        try {
          dateObj = new Date(dateString);
          // If date is invalid, use current date
          if (isNaN(dateObj.getTime())) {
            dateObj = new Date();
          }
        } catch {
          dateObj = new Date();
        }

        // Format date display based on selected time period
        let formattedDate = dateObj.toLocaleDateString();
        if (period === '1D' || period === '5D') {
          formattedDate = format(dateObj, 'HH:mm'); // Show hours:minutes for intraday
        } else if (period === '1M' || period === '6M') {
          formattedDate = format(dateObj, 'MMM dd'); // Show month and day
        } else if (period === 'YTD' || period === '5Y') {
          formattedDate = format(dateObj, 'MMM yyyy'); // Show month and year
        }

        // Ensure all numerical values have defaults
        const closePrice = typeof item.CH_CLOSING_PRICE === 'number' ? item.CH_CLOSING_PRICE :
                          (typeof item.CH_LAST_TRADED_PRICE === 'number' ? item.CH_LAST_TRADED_PRICE : 0);
        const openPrice = typeof item.CH_OPENING_PRICE === 'number' ? item.CH_OPENING_PRICE : closePrice;
        const highPrice = typeof item.CH_TRADE_HIGH_PRICE === 'number' ? item.CH_TRADE_HIGH_PRICE :
                          Math.max(openPrice, closePrice);
        const lowPrice = typeof item.CH_TRADE_LOW_PRICE === 'number' ? item.CH_TRADE_LOW_PRICE :
                         Math.min(openPrice, closePrice);
        const volume = typeof item.CH_TOT_TRADED_QTY === 'number' ? item.CH_TOT_TRADED_QTY : 0;

        return {
          date: formattedDate,
          dateObj: dateObj,
          close: closePrice,
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          volume: volume,
        };
      });
    } catch (err) {
      console.error("Error processing historical data:", err);
      return [];
    }
  }, [data, period]);

  // Calculate if the overall trend is positive
  const isPositiveTrend = useMemo(() => {
    if (!formattedData || formattedData.length <= 1) return true;
    return formattedData[formattedData.length - 1].close >= formattedData[0].close;
  }, [formattedData]);

  const chartColor = isPositiveTrend ? '#22c55e' : '#ef4444';

  // Get the most recent data point safely
  const getLatestData = () => {
    if (!formattedData || formattedData.length === 0) {
      return {
        open: 0,
        close: 0,
        high: 0,
        low: 0
      };
    }
    return formattedData[formattedData.length - 1];
  };

  const latestData = getLatestData();

  // Handle retry for data fetching
  const handleRetry = () => {
    setRetryCount(0);
    mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Chart {symbol && `- ${symbol}`}</CardTitle>
        <CardDescription>
          Price history for the selected period
        </CardDescription>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as '1D' | '5D' | '1M' | '6M' | 'YTD' | '5Y')}
          className="mt-2"
        >
          <TabsList>
            <TabsTrigger value="1D">1D</TabsTrigger>
            <TabsTrigger value="5D">5D</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="YTD">YTD</TabsTrigger>
            <TabsTrigger value="5Y">5Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : error ? (
          <div className="w-full h-[300px] flex flex-col items-center justify-center p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load historical data for {symbol}
              </AlertDescription>
            </Alert>
            <Button onClick={handleRetry} variant="secondary">
              Retry
            </Button>
          </div>
        ) : !symbol ? (
          <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
            Select a stock to view historical data
          </div>
        ) : formattedData.length === 0 ? (
          <div className="w-full h-[300px] flex flex-col items-center justify-center text-muted-foreground p-6">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                No historical data available for {symbol} in the selected period ({period})
              </AlertDescription>
            </Alert>
            <p className="text-sm text-center">
              Try selecting a different time period or check if the stock has historical data
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  return value;
                }}
                minTickGap={30}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(value) => `₹${value}`}
              />
              <RechartsTooltip
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorClose)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {!isLoading && !error && formattedData.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Open</div>
              <div className="font-medium">₹{latestData.open.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Close</div>
              <div className="font-medium">₹{latestData.close.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">High</div>
              <div className="font-medium">₹{latestData.high.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Low</div>
              <div className="font-medium">₹{latestData.low.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
