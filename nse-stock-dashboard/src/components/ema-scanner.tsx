import { useState, useCallback, useEffect } from 'react';
import { useSymbols, useGainersLosers } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  RefreshCwIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  ListFilterIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateAllEMAs, EmaScanResult, priceRelationToEMA } from '@/lib/emaCalculator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Number of stocks to analyze per batch
const BATCH_SIZE = 10;
// Results per page for pagination
const RESULTS_PER_PAGE = 15;

// Popular indices and presets for quicker scanning
const INDEX_PRESETS = {
  'NIFTY50': 'NIFTY 50 stocks',
  'NIFTY100': 'NIFTY 100 stocks',
  'NIFTY200': 'NIFTY 200 stocks',
  'GAINERS': 'Today\'s top gainers',
  'LOSERS': 'Today\'s top losers',
  'CUSTOM': 'Custom selection'
};

// Define a type for the cache
interface EmaCache {
  [symbol: string]: {
    data: EmaScanResult;
    timestamp: number;
  }
}

export function EmaScanner() {
  // Data states
  const { data: symbolsData, error: symbolsError, isLoading: symbolsLoading } = useSymbols();
  const { data: gainersLosersData, error: gainersLosersError, isLoading: gainersLosersLoading } = useGainersLosers();
  const [scanResults, setScanResults] = useState<EmaScanResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<EmaScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [scanFilter, setScanFilter] = useState<'all' | 'above' | 'below'>('all');
  const [emaType, setEmaType] = useState<'10' | '20' | '50' | '200'>('50');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof INDEX_PRESETS>('NIFTY50');
  const [error, setError] = useState<string | null>(null);

  // Cache for storing EMA calculations to improve performance
  const [emaCache, setEmaCache] = useState<EmaCache>({});

  // Get NIFTY 50 stocks (default list for quick scanning)
  const getNifty50Symbols = useCallback(() => {
    // Common NIFTY 50 stocks - this is a simplified list
    const nifty50 = [
      "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
      "HINDUNILVR", "ITC", "HDFC", "SBIN", "BHARTIARTL",
      "KOTAKBANK", "BAJFINANCE", "AXISBANK", "LT", "ASIANPAINT",
      "HCLTECH", "MARUTI", "SUNPHARMA", "TITAN", "BAJAJFINSV",
      "TATAMOTORS", "ULTRACEMCO", "M&M", "ADANIENT", "TATASTEEL",
      "NTPC", "POWERGRID", "ONGC", "GRASIM", "HINDALCO"
    ];

    if (!symbolsData) return [];

    return symbolsData.filter(s => nifty50.includes(s.symbol));
  }, [symbolsData]);

  // Get NIFTY 100 symbols (for broader scanning)
  const getNifty100Symbols = useCallback(() => {
    if (!symbolsData) return [];

    // This is a simplified approach - in a real app you might want to
    // fetch the actual index constituents from an API
    return symbolsData.slice(0, 100);
  }, [symbolsData]);

  // Get NIFTY 200 symbols
  const getNifty200Symbols = useCallback(() => {
    if (!symbolsData) return [];
    return symbolsData.slice(0, 200);
  }, [symbolsData]);

  // Get top gainers from the API
  const getTopGainers = useCallback(() => {
    if (!gainersLosersData?.gainers) return [];

    // Convert gainer data to the format we need
    return gainersLosersData.gainers.map(gainer => {
      const matchingSymbol = symbolsData?.find(s => s.symbol === gainer.symbol);
      return {
        symbol: gainer.symbol,
        companyName: matchingSymbol?.companyName || gainer.symbol
      };
    });
  }, [gainersLosersData, symbolsData]);

  // Get top losers from the API
  const getTopLosers = useCallback(() => {
    if (!gainersLosersData?.losers) return [];

    // Convert loser data to the format we need
    return gainersLosersData.losers.map(loser => {
      const matchingSymbol = symbolsData?.find(s => s.symbol === loser.symbol);
      return {
        symbol: loser.symbol,
        companyName: matchingSymbol?.companyName || loser.symbol
      };
    });
  }, [gainersLosersData, symbolsData]);

  // Get symbols based on the selected preset
  const getSymbolsToScan = useCallback(() => {
    switch (selectedPreset) {
      case 'NIFTY50':
        return getNifty50Symbols();
      case 'NIFTY100':
        return getNifty100Symbols();
      case 'NIFTY200':
        return getNifty200Symbols();
      case 'GAINERS':
        return getTopGainers();
      case 'LOSERS':
        return getTopLosers();
      case 'CUSTOM':
        return symbolsData || [];
      default:
        return getNifty50Symbols();
    }
  }, [selectedPreset, getNifty50Symbols, getNifty100Symbols, getNifty200Symbols, getTopGainers, getTopLosers, symbolsData]);

  // Check if a result is cached and still valid (less than 15 minutes old)
  const getCachedResult = (symbol: string) => {
    const cachedItem = emaCache[symbol];
    if (!cachedItem) return null;

    const now = Date.now();
    const cacheAge = now - cachedItem.timestamp;
    const maxCacheAge = 15 * 60 * 1000; // 15 minutes

    if (cacheAge < maxCacheAge) {
      return cachedItem.data;
    }

    return null;
  };

  // Prepare for scanning
  const handleStartScan = useCallback(async () => {
    const symbolsToScan = getSymbolsToScan();

    if (symbolsToScan.length === 0 || isScanning) {
      return;
    }

    // Start fresh
    setIsScanning(true);
    setError(null);

    // Keep existing results if they're for the same symbols
    // This allows for fast filtering by EMA type without rescanning
    if (scanResults.length === 0 || scanResults[0]?.symbol !== symbolsToScan[0]?.symbol) {
      setScanResults([]);
    }

    setScanProgress({ current: 0, total: symbolsToScan.length });
    setCurrentPage(1);

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < symbolsToScan.length; i += BATCH_SIZE) {
      const batch = symbolsToScan.slice(i, i + BATCH_SIZE);

      // Process each symbol in the batch concurrently
      await Promise.all(batch.map(async (symbolData) => {
        const symbol = symbolData.symbol;
        const companyName = symbolData.companyName;

        try {
          // Check if we have a cached result first
          const cachedResult = getCachedResult(symbol);
          if (cachedResult) {
            // Use cached result instead of fetching new data
            setScanResults(prev => {
              // Only add if not already in the results
              if (!prev.some(r => r.symbol === symbol)) {
                return [...prev, cachedResult];
              }
              return prev;
            });
          } else {
            // No cache hit, scan the stock for EMA relationships
            await scanStock(symbol, companyName);
          }
        } catch (error) {
          console.error(`Error scanning ${symbol}:`, error);
        }

        // Update progress
        setScanProgress(prev => ({ current: prev.current + 1, total: prev.total }));
      }));
    }

    setIsScanning(false);
  }, [getSymbolsToScan, isScanning, scanResults, getCachedResult]);

  // Scan an individual stock
  const scanStock = async (symbol: string, companyName: string) => {
    try {
      // Calculate date range for historical data (1 year is enough for 200 EMA)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch historical data
      const response = await fetch(`/api/nse/equity/historical?symbol=${symbol}&startDate=${startDateStr}&endDate=${endDateStr}`);
      const data = await response.json();

      if (!data.success || !data.data?.data || !Array.isArray(data.data.data)) {
        console.warn(`No historical data for ${symbol}`);
        return;
      }

      // Calculate EMAs
      const emaData = calculateAllEMAs(data.data.data);

      // Create result object
      const result: EmaScanResult = {
        symbol,
        companyName,
        currentPrice: emaData.currentPrice,
        ema10: emaData.currentEma10,
        ema20: emaData.currentEma20,
        ema50: emaData.currentEma50,
        ema200: emaData.currentEma200,
        relationToEma10: priceRelationToEMA(emaData.currentPrice, emaData.currentEma10),
        relationToEma20: priceRelationToEMA(emaData.currentPrice, emaData.currentEma20),
        relationToEma50: priceRelationToEMA(emaData.currentPrice, emaData.currentEma50),
        relationToEma200: priceRelationToEMA(emaData.currentPrice, emaData.currentEma200),
      };

      // Cache the result
      setEmaCache(prev => ({
        ...prev,
        [symbol]: {
          data: result,
          timestamp: Date.now()
        }
      }));

      // Add to results
      setScanResults(prev => {
        // Only add if not already in the results
        if (!prev.some(r => r.symbol === symbol)) {
          return [...prev, result];
        }
        return prev;
      });
    } catch (error) {
      console.error(`Error scanning ${symbol}:`, error);
    }
  };

  // Apply filters to scan results
  useEffect(() => {
    if (!scanResults.length) {
      setFilteredResults([]);
      setTotalPages(1);
      return;
    }

    let filtered = [...scanResults];

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(result =>
        result.symbol.toLowerCase().includes(search) ||
        result.companyName.toLowerCase().includes(search)
      );
    }

    // Apply EMA filter
    if (scanFilter !== 'all') {
      filtered = filtered.filter(result => {
        const relation = result[`relationToEma${emaType}` as keyof EmaScanResult];
        return relation === scanFilter;
      });
    }

    // Set filtered results and update pagination
    setFilteredResults(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE)));
    setCurrentPage(prev => Math.min(prev, Math.ceil(filtered.length / RESULTS_PER_PAGE) || 1));
  }, [scanResults, searchTerm, scanFilter, emaType]);

  // Handle pagination
  const getPaginatedResults = useCallback(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    return filteredResults.slice(start, end);
  }, [filteredResults, currentPage]);

  // Auto-start the scan for the selected preset
  useEffect(() => {
    if (!isScanning && symbolsData && selectedPreset !== 'CUSTOM') {
      handleStartScan();
    }
  }, [selectedPreset, symbolsData, isScanning, handleStartScan]);

  // Format numbers
  const formatNumber = (num: number | null) => {
    if (num === null || isNaN(Number(num))) return 'N/A';
    return num.toFixed(2);
  };

  // Percentage calculation from current price to EMA
  const calculatePercentToEMA = (price: number, ema: number | null) => {
    if (ema === null || ema === 0) return null;
    return ((price - ema) / ema) * 100;
  };

  // Format percentage
  const formatPercent = (percent: number | null) => {
    if (percent === null || isNaN(Number(percent))) return 'N/A';
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Calculate scan completion percentage
  const completionPercentage = scanProgress.total ? (scanProgress.current / scanProgress.total) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>EMA Scanner</CardTitle>
        <CardDescription>
          Scan stocks for their position relative to Exponential Moving Averages
        </CardDescription>

        {/* Index Preset Selection */}
        <Tabs
          value={selectedPreset}
          onValueChange={(value) => setSelectedPreset(value as keyof typeof INDEX_PRESETS)}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="NIFTY50">NIFTY 50</TabsTrigger>
            <TabsTrigger value="NIFTY100">NIFTY 100</TabsTrigger>
            <TabsTrigger value="NIFTY200">NIFTY 200</TabsTrigger>
            <TabsTrigger value="GAINERS">Gainers</TabsTrigger>
            <TabsTrigger value="LOSERS">Losers</TabsTrigger>
            <TabsTrigger value="CUSTOM">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scan controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={handleStartScan}
              disabled={isScanning || symbolsLoading || !symbolsData}
              className="flex items-center"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? `Scanning (${scanProgress.current}/${scanProgress.total})` : 'Scan Now'}
            </Button>

            {/* Status info */}
            <div className="text-sm text-muted-foreground flex items-center">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Scanning: {INDEX_PRESETS[selectedPreset]}
              {selectedPreset !== 'CUSTOM' && (
                <Badge variant="outline" className="ml-2">
                  {getSymbolsToScan().length} stocks
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            {isScanning && (
              <div className="flex-1 bg-secondary rounded-full overflow-hidden h-10">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by symbol or company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isScanning}
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={emaType}
                onValueChange={(value) => setEmaType(value as '10' | '20' | '50' | '200')}
                disabled={isScanning}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select EMA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">EMA 10</SelectItem>
                  <SelectItem value="20">EMA 20</SelectItem>
                  <SelectItem value="50">EMA 50</SelectItem>
                  <SelectItem value="200">EMA 200</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={scanFilter}
                onValueChange={(value) => setScanFilter(value as 'all' | 'above' | 'below')}
                disabled={isScanning}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stocks</SelectItem>
                  <SelectItem value="above">Above EMA</SelectItem>
                  <SelectItem value="below">Below EMA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results counts */}
          {filteredResults.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <ListFilterIcon className="h-3 w-3" />
                {filteredResults.length} results
              </Badge>

              <Badge variant="secondary" className="flex items-center gap-1">
                <ArrowUpIcon className="h-3 w-3 text-green-500" />
                {filteredResults.filter(r => r[`relationToEma${emaType}` as keyof EmaScanResult] === 'above').length} above EMA {emaType}
              </Badge>

              <Badge variant="secondary" className="flex items-center gap-1">
                <ArrowDownIcon className="h-3 w-3 text-red-500" />
                {filteredResults.filter(r => r[`relationToEma${emaType}` as keyof EmaScanResult] === 'below').length} below EMA {emaType}
              </Badge>
            </div>
          )}

          {/* Results table */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>EMA 10</TableHead>
                  <TableHead>EMA 20</TableHead>
                  <TableHead>EMA 50</TableHead>
                  <TableHead>EMA 200</TableHead>
                  <TableHead>Relation to EMA {emaType}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symbolsLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      {Array(7).fill(0).map((_, cellIndex) => (
                        <TableCell key={`loading-cell-${cellIndex}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : scanResults.length === 0 && !isScanning ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      {symbolsError ? (
                        <div className="text-red-500">Error loading symbols. Please try again.</div>
                      ) : (
                        <div className="text-muted-foreground">
                          Click "Scan Now" to analyze stocks
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : getPaginatedResults().length === 0 && !isScanning ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        No stocks match your filter criteria
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedResults().map((result) => (
                    <TableRow key={result.symbol}>
                      <TableCell className="font-medium">
                        {result.symbol}
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {result.companyName}
                        </div>
                      </TableCell>
                      <TableCell>₹{formatNumber(result.currentPrice)}</TableCell>
                      <TableCell className={result.relationToEma10 === 'above' ? 'text-green-500' : result.relationToEma10 === 'below' ? 'text-red-500' : ''}>
                        ₹{formatNumber(result.ema10)}
                        {result.ema10 && (
                          <div className="text-xs flex items-center">
                            {result.relationToEma10 === 'above' ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(calculatePercentToEMA(result.currentPrice, result.ema10))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={result.relationToEma20 === 'above' ? 'text-green-500' : result.relationToEma20 === 'below' ? 'text-red-500' : ''}>
                        ₹{formatNumber(result.ema20)}
                        {result.ema20 && (
                          <div className="text-xs flex items-center">
                            {result.relationToEma20 === 'above' ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(calculatePercentToEMA(result.currentPrice, result.ema20))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={result.relationToEma50 === 'above' ? 'text-green-500' : result.relationToEma50 === 'below' ? 'text-red-500' : ''}>
                        ₹{formatNumber(result.ema50)}
                        {result.ema50 && (
                          <div className="text-xs flex items-center">
                            {result.relationToEma50 === 'above' ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(calculatePercentToEMA(result.currentPrice, result.ema50))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={result.relationToEma200 === 'above' ? 'text-green-500' : result.relationToEma200 === 'below' ? 'text-red-500' : ''}>
                        ₹{formatNumber(result.ema200)}
                        {result.ema200 && (
                          <div className="text-xs flex items-center">
                            {result.relationToEma200 === 'above' ? (
                              <ArrowUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(calculatePercentToEMA(result.currentPrice, result.ema200))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {result[`relationToEma${emaType}` as keyof EmaScanResult] === 'above' ? (
                          <Badge className="bg-green-500">Above</Badge>
                        ) : result[`relationToEma${emaType}` as keyof EmaScanResult] === 'below' ? (
                          <Badge className="bg-red-500">Below</Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredResults.length > RESULTS_PER_PAGE && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredResults.length > 0 ? (currentPage - 1) * RESULTS_PER_PAGE + 1 : 0} - {Math.min(currentPage * RESULTS_PER_PAGE, filteredResults.length)} of {filteredResults.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isScanning}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isScanning}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
