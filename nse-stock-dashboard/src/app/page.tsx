'use client';

import { useState } from 'react';
import { StockSearch } from '@/components/stock-search';
import { StockChart } from '@/components/stock-chart';
import { StockDetails } from '@/components/stock-details';
import { MarketOverview } from '@/components/market-overview';
import { MostActive } from '@/components/most-active';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MarketStatusIndicator } from '@/components/market-status-indicator';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSymbol = searchParams.get('symbol') || '';
  const [selectedStock, setSelectedStock] = useState<string>(initialSymbol);

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);

    // Update URL with selected stock for sharing/bookmarking
    router.push(`/?symbol=${symbol}`, { scroll: false });
  };

  return (
    <main className="max-w-full overflow-x-hidden">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">NSE Stock Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time data from National Stock Exchange of India
              </p>
            </div>
            <div className="md:hidden">
              <MarketStatusIndicator />
            </div>
          </div>
        </div>

        <div className="relative">
          <StockSearch onSelect={handleStockSelect} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-help mt-1">
                  <InfoIcon className="h-4 w-4 mr-1" />
                  <span>Try searching for RELIANCE, TCS, or INFY</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter a stock symbol or company name to search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {selectedStock && (
              <StockDetails symbol={selectedStock} />
            )}
          </div>
          <div className="md:col-span-2">
            {selectedStock && (
              <StockChart symbol={selectedStock} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MarketOverview />
          <MostActive />
        </div>

        <footer className="text-center text-muted-foreground text-sm mt-8 border-t pt-4">
          <p>
            Data provided by National Stock Exchange of India Ltd.
          </p>
          <p className="mt-1">
            This dashboard is for informational purposes only. Not financial advice.
          </p>
        </footer>
      </div>
    </main>
  );
}
