'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSymbols } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { EquityDetails, SymbolWithCompany } from '@/types/nse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Number of rows per page
const ROWS_PER_PAGE = 10;

export function StockDashboardClient() {
  const { data: symbolsData, error: symbolsError, isLoading: symbolsLoading } = useSymbols();
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedSymbols, setDisplayedSymbols] = useState<string[]>([]);
  const [stockDetails, setStockDetails] = useState<Record<string, EquityDetails | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);

  // Add this memoized sectors collector
  const collectSector = useCallback((details: EquityDetails) => {
    // Extract sector directly here instead of using getSector function
    // to avoid circular dependencies
    let sector = 'N/A';

    if (details.industryInfo?.macroSector) {
      sector = details.industryInfo.macroSector;
    } else if (details.industryInfo?.industry) {
      sector = details.industryInfo.industry;
    } else if (details.metadata?.industry) {
      sector = details.metadata.industry;
    } else if (details.info?.industry) {
      sector = details.info.industry;
    }

    if (sector !== 'N/A') {
      setSectors(prev => {
        if (!prev.includes(sector)) {
          return [...prev, sector];
        }
        return prev;
      });
    }
  }, []);

  // When symbols data loads, set up initial displayed symbols
  useEffect(() => {
    if (symbolsData && symbolsData.length > 0) {
      // Start with NIFTY 50 stocks (popular ones)
      const initialSymbols = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
        "HINDUNILVR", "ITC", "SBIN", "BAJFINANCE", "BHARTIARTL",
        "KOTAKBANK", "AXISBANK", "LT", "MARUTI", "ASIANPAINT",
        "HCLTECH", "SUNPHARMA", "WIPRO", "TATAMOTORS", "ULTRACEMCO"
      ];

      // Filter to ensure they exist in our symbols data
      const validatedSymbols = initialSymbols.filter(sym =>
        symbolsData.some(s => s.symbol === sym)
      );

      setDisplayedSymbols(validatedSymbols);
    }
  }, [symbolsData]);

  // Modify the useEffect for fetching stock details
  useEffect(() => {
    const fetchStockDetails = async () => {
      if (displayedSymbols.length === 0) return;

      setIsLoading(true);

      const details: Record<string, EquityDetails | null> = { ...stockDetails };
      const symbolsToFetch = displayedSymbols.filter(symbol => !details[symbol]);

      // If no new symbols to fetch, we can skip the API calls
      if (symbolsToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      // Batch API calls to reduce load (5 symbols at a time)
      const batchSize = 5;
      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        const batch = symbolsToFetch.slice(i, i + batchSize);

        await Promise.all(batch.map(async (symbol) => {
          try {
            const response = await fetch(`/api/nse/equity/details?symbol=${symbol}`);
            const data = await response.json();

            if (data.success && data.data) {
              details[symbol] = data.data;

              // Use the memoized function
              collectSector(data.data);
            } else {
              details[symbol] = null;
            }
          } catch (error) {
            console.error(`Error fetching details for ${symbol}:`, error);
            details[symbol] = null;
          }
        }));
      }

      setStockDetails(details);
      setIsLoading(false);
    };

    fetchStockDetails();
  }, [displayedSymbols, collectSector, stockDetails]); // Added stockDetails to dependency array

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Get sector/industry - memoize this function
  const getSector = useCallback((details: EquityDetails | null) => {
    if (!details) return 'N/A';

    if (details.industryInfo?.macroSector) {
      return details.industryInfo.macroSector;
    }
    if (details.industryInfo?.industry) {
      return details.industryInfo.industry;
    }
    if (details.metadata?.industry) {
      return details.metadata.industry;
    }
    if (details.info?.industry) {
      return details.info.industry;
    }

    return 'N/A';
  }, []);

  // Apply search and filters
  const filteredSymbols = useCallback(() => {
    if (!symbolsData) return displayedSymbols;

    let filtered = searchTerm.trim() !== ''
      ? symbolsData
          .filter(item =>
            item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.companyName && item.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(item => item.symbol)
      : displayedSymbols;

    // Apply sector filter if selected
    if (selectedSector && filtered.length > 0) {
      filtered = filtered.filter(symbol => {
        const details = stockDetails[symbol];
        return details && getSector(details) === selectedSector;
      });
    }

    return filtered;
  }, [searchTerm, symbolsData, displayedSymbols, selectedSector, stockDetails, getSector]);

  // Add effect to fetch details for search results
  useEffect(() => {
    // Skip if no search or no symbol data
    if (searchTerm.trim() === '' || !symbolsData) return;

    const filtered = filteredSymbols();
    // Skip if there's nothing to fetch
    if (filtered.length === 0) return;

    // This will trigger the existing effect that fetches details
    // but we need to make sure it includes search results
    if (filtered.some(symbol => !displayedSymbols.includes(symbol))) {
      setDisplayedSymbols(prev => {
        // Add new symbols from search to displayed symbols
        const newSymbols = filtered.filter(symbol => !prev.includes(symbol));
        if (newSymbols.length > 0) {
          return [...prev, ...newSymbols];
        }
        return prev;
      });
    }
  }, [searchTerm, symbolsData, filteredSymbols, displayedSymbols]);

  // Get paginated symbols
  const getPaginatedSymbols = useCallback(() => {
    const filtered = filteredSymbols();
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return filtered.slice(start, end);
  }, [filteredSymbols, currentPage]);

  // Add a new effect to ensure details are fetched for visible symbols
  useEffect(() => {
    const visibleSymbols = getPaginatedSymbols();
    if (visibleSymbols.length === 0) return;

    // Check if we need to fetch details for any visible symbols
    const needToFetch = visibleSymbols.some(symbol => !stockDetails[symbol]);

    if (needToFetch) {
      const fetchVisibleStockDetails = async () => {
        setIsLoading(true);

        const details = { ...stockDetails };
        const symbolsToFetch = visibleSymbols.filter(symbol => !details[symbol]);

        // Fetch details for each symbol
        for (const symbol of symbolsToFetch) {
          try {
            console.log(`Fetching equity details for symbol: ${symbol}`);
            const response = await fetch(`/api/nse/equity/details?symbol=${symbol}`);
            const data = await response.json();

            if (data.success && data.data) {
              details[symbol] = data.data;
              collectSector(data.data);
            } else {
              details[symbol] = null;
            }
          } catch (error) {
            console.error(`Error fetching details for ${symbol}:`, error);
            details[symbol] = null;
          }
        }

        setStockDetails(details);
        setIsLoading(false);
      };

      fetchVisibleStockDetails();
    }
  }, [getPaginatedSymbols, stockDetails, collectSector]);

  // Don't update state during rendering - move this to an effect
  useEffect(() => {
    const filtered = filteredSymbols();
    setTotalPages(Math.ceil(filtered.length / ROWS_PER_PAGE) || 1); // Ensure at least 1 page
  }, [filteredSymbols]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Sector filter handler
  const handleSectorFilter = (sector: string | null) => {
    setSelectedSector(sector);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Format helper functions
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

  const formatPercent = (num: number | string | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  const formatNumberInCrores = (num: number | string | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';
    return `₹${(numValue / 10000000).toFixed(2)} Cr`;
  };

  // Calculate % from 52-week high/low
  const calculatePercentFromRange = (current: number, rangeValue: number) => {
    if (!current || !rangeValue) return 'N/A';
    const percent = ((current - rangeValue) / rangeValue) * 100;
    return formatPercent(percent);
  };

  // Get 52-week high and low
  const get52WeekRange = (details: EquityDetails | null) => {
    if (!details?.priceInfo?.weekHighLow) return { high: 0, low: 0 };
    return {
      high: details.priceInfo.weekHighLow.max,
      low: details.priceInfo.weekHighLow.min
    };
  };

  // Get market cap
  const getMarketCap = (details: EquityDetails | null) => {
    if (!details) return undefined;

    // First try securityInfo.marketCap
    if (details.securityInfo?.marketCap) {
      return details.securityInfo.marketCap;
    }

    // Calculate if marketCap not available but we have issuedSize and price
    if (details.securityInfo?.issuedSize && details.priceInfo?.lastPrice) {
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

  // Get RS Rating (not available in API)
  const getRSRating = () => {
    return 'N/A';
  };

  // Get Free Float % (not directly available in API)
  const getFreeFloat = () => {
    return 'N/A';
  };

  // Get Performance Rank (not available in API)
  const getPerformanceRank = () => {
    return 'N/A';
  };

  // Get circuit limit from price band
  const getCircuitLimit = (details: EquityDetails | null) => {
    if (!details) return 'N/A';
    return details.priceInfo?.pPriceBand || 'N/A';
  };

  // Get index membership
  const getIndexMembership = (details: EquityDetails | null) => {
    if (!details) return 'N/A';
    return details.info?.isKeyinCandidate ? 'NIFTY' : 'N/A';
  };

  // Get visible symbols based on pagination and filters
  const visibleSymbols = getPaginatedSymbols();

  return (
    <main className="max-w-full overflow-x-hidden">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NSE Stock Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive stock data from National Stock Exchange of India</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search for a stock symbol or company..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSector === null ? "default" : "outline"}
              size="sm"
              onClick={() => handleSectorFilter(null)}
            >
              All Sectors
            </Button>
            {sectors.slice(0, 5).map(sector => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                onClick={() => handleSectorFilter(sector)}
              >
                {sector}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Stock Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Stock Name</TableHead>
                    <TableHead>RS Rating</TableHead>
                    <TableHead>Listing Date</TableHead>
                    <TableHead>Basic Industry</TableHead>
                    <TableHead>Market Cap(Cr)</TableHead>
                    <TableHead>% from 52W High</TableHead>
                    <TableHead>% from 52W Low</TableHead>
                    <TableHead>Stock Price(₹)</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Free Float(%)</TableHead>
                    <TableHead>Circuit Limit</TableHead>
                    <TableHead>% from ATH</TableHead>
                    <TableHead>Industry ID</TableHead>
                    <TableHead>Performance Rank</TableHead>
                    <TableHead>Industry 1W Rank</TableHead>
                    <TableHead>Industry 1M Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(ROWS_PER_PAGE).fill(0).map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        {Array(17).fill(0).map((_, cellIndex) => (
                          <TableCell key={`loading-cell-${cellIndex}`} className={cellIndex === 0 ? "sticky left-0 bg-background" : ""}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    visibleSymbols.map((symbol) => {
                      const details = stockDetails[symbol];
                      const range52Week = get52WeekRange(details);

                      return (
                        <TableRow key={symbol} className="hover:bg-secondary/40 transition-colors">
                          <TableCell className="font-medium sticky left-0 bg-background">
                            {details?.info?.symbol || symbol}
                            <div className="text-xs text-muted-foreground">
                              {details?.info?.companyName || ''}
                            </div>
                          </TableCell>
                          <TableCell>{getRSRating()}</TableCell>
                          <TableCell>{details?.metadata?.listingDate || 'N/A'}</TableCell>
                          <TableCell>{details?.info?.industry || 'N/A'}</TableCell>
                          <TableCell>{formatNumberInCrores(getMarketCap(details))}</TableCell>
                          <TableCell className="text-red-500">
                            {details?.priceInfo?.lastPrice && range52Week.high
                              ? calculatePercentFromRange(details.priceInfo.lastPrice, range52Week.high)
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell className="text-green-500">
                            {details?.priceInfo?.lastPrice && range52Week.low
                              ? calculatePercentFromRange(details.priceInfo.lastPrice, range52Week.low)
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell className={details?.priceInfo?.change && details.priceInfo.change > 0 ? 'text-green-500' : 'text-red-500'}>
                            {details?.priceInfo?.lastPrice
                              ? details.priceInfo.lastPrice.toFixed(2)
                              : 'N/A'
                            }
                            {details?.priceInfo?.change && (
                              <div className="flex items-center text-xs">
                                {details.priceInfo.change > 0 ? (
                                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                                ) : (
                                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                                )}
                                {formatPercent(details.priceInfo.pChange)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getIndexMembership(details)}
                          </TableCell>
                          <TableCell>{getSector(details)}</TableCell>
                          <TableCell>{getFreeFloat()}</TableCell>
                          <TableCell>{getCircuitLimit(details)}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>{getPerformanceRank()}</TableCell>
                          <TableCell>N/A</TableCell>
                          <TableCell>N/A</TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {/* Empty state row when no results */}
                  {!isLoading && visibleSymbols.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={17} className="h-24 text-center">
                        No stocks found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {visibleSymbols.length > 0 ? (currentPage - 1) * ROWS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ROWS_PER_PAGE, filteredSymbols().length)} of {filteredSymbols().length} stocks
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
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
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
